// app.js - REPLACE the old contents with this file
$(document).ready(
  
  function () {
  // ==========================
  // Variables Initialization
  // ==========================
  let processList = [];
  let schedule = [];
  let simulationTime = 0;
  let queues = {};
  let allProcesses = [];
  let completedList = [];
  let quantum = 0;
  let agingTime = 0;
  let priorityDecreaseTime = 0;
  let currentProcess = null;
  let currentQuantumRemaining = 0;

  // Default processes (editable by user)
  let defaultProcesses = [
    { pid: 1, at: 1, bt: 20, pr: 3 },
    { pid: 2, at: 3, bt: 10, pr: 4 },
    { pid: 3, at: 5, bt: 2, pr: 1 },
  ];

  // --------------------------
  // Build initial processList & table
  // --------------------------
  $('#processID').val(defaultProcesses[0].pid);
  $('#arrivalTime').val(defaultProcesses[0].at);
  $('#burstTime').val(defaultProcesses[0].bt);
  $('#priority').val(defaultProcesses[0].pr);

  defaultProcesses.forEach((p) => {
    let proc = {
      processID: p.pid,
      arrivalTime: p.at,
      burstTime: p.bt,
      originalBurstTime: p.bt,
      priority: p.pr,
      waitingTime: 0,
      lastExecutedAt: null,
      timeProcessed: 0,
      completed: false,
      timeSliceCounter: 0,
    };
    processList.push(proc);

    $('#tblProcessList tbody').append(
      `<tr>
                <td contenteditable="true">${proc.processID}</td>
                <td contenteditable="true">${proc.arrivalTime}</td>
                <td contenteditable="true">${proc.burstTime}</td>
                <td contenteditable="true">${proc.priority}</td>
                <td><button class="btn btn-danger btn-sm btnDelete">Delete</button></td>
            </tr>`
    );
  });

  // ==========================
  // Table editing handlers
  // ==========================
  $('#tblProcessList').on('focus', 'td[contenteditable="true"]', function () {
    $(this).data('original-value', $(this).text());
  });

  $('#tblProcessList').on('blur', 'td[contenteditable="true"]', function () {
    let row = $(this).closest('tr');
    let rowIndex = row.index();
    let colIndex = $(this).index();
    let newValue = $(this).text().trim();
    let oldPID = parseInt(
      row.find('td:eq(0)').data('original-value') ||
        row.find('td:eq(0)').text()
    );

    if (newValue === '') {
      alert('Field cannot be empty!');
      $(this).text($(this).data('original-value') || '1');
      return;
    }
    if (isNaN(newValue)) {
      alert('Value must be a number!');
      $(this).text($(this).data('original-value') || '1');
      return;
    }

    newValue = parseInt(newValue);

    // Validate depending on column
    switch (colIndex) {
      case 0: // PID
        if (newValue <= 0) {
          alert('Process ID must be > 0');
          $(this).text($(this).data('original-value') || '1');
          return;
        }
        // duplicate check
        let dup = false;
        $('#tblProcessList tbody tr').each(function (idx) {
          if (
            idx !== rowIndex &&
            parseInt($(this).find('td:eq(0)').text()) === newValue
          ) {
            dup = true;
            return false;
          }
        });
        if (dup) {
          alert('Process ID already exists!');
          $(this).text($(this).data('original-value') || '1');
          return;
        }
        break;
      case 1: // Arrival
        if (newValue < 0 || newValue > 50) {
          alert('Arrival must be between 0 and 50');
          $(this).text($(this).data('original-value') || '0');
          return;
        }
        break;
      case 2: // Burst
        if (newValue <= 0 || newValue > 50) {
          alert('Burst must be 1..50');
          $(this).text($(this).data('original-value') || '1');
          return;
        }
        break;
      case 3: // Priority
        if (newValue < 1 || newValue > 4) {
          alert('Priority must be 1..4');
          $(this).text($(this).data('original-value') || '1');
          return;
        }
        break;
    }

    // Update processList
    let pid = parseInt(row.find('td:eq(0)').text());
    let process = processList.find((p) => p.processID === oldPID);
    if (process) {
      process.processID = parseInt(row.find('td:eq(0)').text());
      process.arrivalTime = parseInt(row.find('td:eq(1)').text());
      process.burstTime = parseInt(row.find('td:eq(2)').text());
      process.originalBurstTime = parseInt(row.find('td:eq(2)').text());
      process.priority = parseInt(row.find('td:eq(3)').text());
    }
  });

  // Delete process
  $('#tblProcessList').on('click', '.btnDelete', function () {
    let row = $(this).closest('tr');
    let pid = parseInt(row.find('td:first').text());
    processList = processList.filter((p) => p.processID !== pid);
    row.remove();
  });

  // ==========================
  // Add New Process Button
  // ==========================
  $('#btnAddProcess').on('click', function () {
    let pid = $('#processID').val();
    let at = $('#arrivalTime').val();
    let bt = $('#burstTime').val();
    let pr = $('#priority').val();

    if (pid === '' || at === '' || bt === '' || pr === '') {
      alert('Fill all fields!');
      return;
    }
    pid = parseInt(pid);
    at = parseInt(at);
    bt = parseInt(bt);
    pr = parseInt(pr);

    if (isNaN(pid) || isNaN(at) || isNaN(bt) || isNaN(pr)) {
      alert('Numbers only!');
      return;
    }
    if (pid <= 0) {
      alert('PID must be >0');
      return;
    }
    if (at < 0 || at > 50) {
      alert('Arrival 0..50');
      return;
    }
    if (bt <= 0 || bt > 50) {
      alert('Burst 1..50');
      return;
    }
    if (pr < 1 || pr > 4) {
      alert('Priority 1..4');
      return;
    }
    if (processList.some((p) => p.processID === pid)) {
      alert('Process ID already exists!');
      return;
    }

    let proc = {
      processID: pid,
      arrivalTime: at,
      burstTime: bt,
      originalBurstTime: bt,
      priority: pr,
      waitingTime: 0,
      lastExecutedAt: null,
      timeProcessed: 0,
      completed: false,
      timeSliceCounter: 0,
    };
    processList.push(proc);

    $('#tblProcessList tbody').append(
      `<tr>
                <td contenteditable="true">${proc.processID}</td>
                <td contenteditable="true">${proc.arrivalTime}</td>
                <td contenteditable="true">${proc.burstTime}</td>
                <td contenteditable="true">${proc.priority}</td>
                <td><button class="btn btn-danger btn-sm btnDelete">Delete</button></td>
            </tr>`
    );

    $('#processID').val(pid + 1);
    $('#arrivalTime').val('');
    $('#burstTime').val('');
    $('#priority').val('');
  });

  // ==========================
  // Default params
  // ==========================
  $('#timeQuantum').val(4);
  $('#aging').val(5);
  $('#priorityDecrease').val(6);

  // ==========================
  // Reset Simulation
  // ==========================
  function resetSimulation() {
    simulationTime = 0;
    schedule = [];
    completedList = [];
    queues = {};
    currentProcess = null;
    currentQuantumRemaining = 0;

    // deep copy and initialize fields
    allProcesses = processList.map((p) => {
      return {
        processID: p.processID,
        arrivalTime: p.arrivalTime,
        burstTime: p.burstTime,
        originalBurstTime: p.originalBurstTime ?? p.burstTime,
        priority: p.priority,
        waitingTime: 0,
        lastExecutedAt: null,
        timeProcessed: 0,
        completed: false,
        timeSliceCounter: 0,
      };
    });

    // initialize queues for priorities 1..4 to keep UI stable
    for (let pr = 1; pr <= 4; pr++) queues[pr] = [];

    // read params
    quantum = parseInt($('#timeQuantum').val());
    agingTime = parseInt($('#aging').val());
    priorityDecreaseTime = parseInt($('#priorityDecrease').val());

    if (isNaN(quantum) || quantum <= 0) {
      alert('Time Quantum must be a positive number!');
      return false;
    }
    if (isNaN(agingTime) || agingTime <= 0) {
      alert('Aging Time Units must be a positive number!');
      return false;
    }
    if (isNaN(priorityDecreaseTime) || priorityDecreaseTime <= 0) {
      alert('Priority Decrease Units must be a positive number!');
      return false;
    }

    // clear UI
    $('#tblResults tbody').empty();
    $('#ganttChart').empty();
    $('#avgTurnaroundTime').val('');
    $('#avgWaitingTime').val('');
    $('#throughput').val('');
    for (let pr = 1; pr <= 4; pr++) {
      $(`#queue${pr} .queue-content`).empty();
    }

    return true;
  }

  // ==========================
  // Button wiring
  // ==========================
  $('#btnCalculate').on('click', function () {
    if (processList.length === 0) {
      alert('Insert some processes first!');
      return;
    }
    if (!resetSimulation()) return;
    $('#nextBtnWrapper').hide();
    runFullSimulation();
  });

  $('#btnStepByStep').on('click', function () {
    if (processList.length === 0) {
      alert('Insert some processes first!');
      return;
    }
    if (!resetSimulation()) return;
    $('#nextBtnWrapper').show();
    runNextUnit();
  });

  $('#btnNextTime').on('click', function () {
    if (
      allProcesses.length > 0 ||
      Object.values(queues).some((q) => q.length > 0) ||
      currentProcess
    ) {
      runNextUnit();
    } else {
      alert('Simulation completed!');
    }
  });

  // ==========================
  // Core simulation helpers
  // ==========================
  function addArrivals() {
    // move arrived processes from allProcesses to queues
    for (let i = allProcesses.length - 1; i >= 0; i--) {
      if (allProcesses[i].arrivalTime <= simulationTime) {
        let p = allProcesses.splice(i, 1)[0];
        p.waitingTime = 0;
        if (!queues[p.priority]) queues[p.priority] = [];
        queues[p.priority].push(p);
      }
    }
  }

  function applyAging() {
    let aged = [];

    // check every queue
    let priorities = Object.keys(queues)
      .map(Number)
      .sort((a, b) => a - b);
    for (let pr of priorities) {
      let queue = queues[pr];
      for (let i = queue.length - 1; i >= 0; i--) {
        let proc = queue[i];
        // ensure waitingTime exists
        if (proc.waitingTime === undefined) proc.waitingTime = 0;

        // only check those actually waiting in queue
        if (proc.waitingTime >= agingTime && proc.priority > 1) {
          queue.splice(i, 1);
          proc.priority = proc.priority - 1; // promote
          proc.waitingTime = 0; // reset
          aged.push(proc);
        }
      }
    }

    // requeue aged
    for (let proc of aged) {
      if (!queues[proc.priority]) queues[proc.priority] = [];
      queues[proc.priority].push(proc);
    }

    // deduplicate (safety)
    let seen = new Set();
    for (let p in queues) {
      queues[p] = queues[p].filter((proc) => {
        if (!proc || proc.processID === undefined) return false;
        if (seen.has(proc.processID)) return false;
        seen.add(proc.processID);
        return true;
      });
    }
  }

  function getHighestPriority() {
    // 1 is highest (smallest number)
    for (let pr = 1; pr <= 4; pr++) {
      if (queues[pr] && queues[pr].length > 0) return pr;
    }
    return null;
  }

  function applyPriorityDecrease(proc) {
    // Called when a process runs — counts how long it's been running
    proc.timeSliceCounter = (proc.timeSliceCounter || 0) + 1;
    if (proc.timeSliceCounter >= priorityDecreaseTime) {
      // lower priority (higher number)
      if (proc.priority < 4) proc.priority++;
      proc.timeSliceCounter = 0;
    }
  }

  function runNextUnit() {
    // 1) Add arrivals that appear at current simulationTime
    addArrivals();

    // 2) Apply aging based on waiting counters (promote before scheduling)
    applyAging();
    drawPriorityQueues();

    // 3) If no currentProcess, pick one
    if (!currentProcess || currentQuantumRemaining === 0) {
      // if currentProcess existed and quantum expired but still has burstTime:
      if (currentProcess && currentQuantumRemaining === 0 && currentProcess.burstTime > 0) {
        // put it back to its (possibly updated) priority queue
        if (!queues[currentProcess.priority]) queues[currentProcess.priority] = [];
        queues[currentProcess.priority].push(currentProcess);
        currentProcess = null;
      }

      let pr = getHighestPriority();
      if (pr === null) {
        // CPU idle for one unit
        schedule.push({ processId: null, start: simulationTime, duration: 1 });
        // increment waiting counters for all queued processes (they waited 1 more unit)
        incrementWaitingForQueued();
        simulationTime++;
        drawGanttChart();
        drawPriorityQueues();
        return;
      }
      currentProcess = queues[pr].shift();
      currentProcess.waitingTime = 0; // reset when it starts running
      currentQuantumRemaining = Math.min(currentProcess.burstTime, quantum);
      currentProcess.timeSliceCounter = currentProcess.timeSliceCounter || 0;
    }

    // 4) Execute currentProcess for 1 time unit
    currentProcess.burstTime--;
    currentProcess.timeProcessed = (currentProcess.timeProcessed || 0) + 1;
    currentProcess.lastExecutedAt = simulationTime;
    schedule.push({
      processId: currentProcess.processID,
      start: simulationTime,
      duration: 1,
    });
    // decrease quantum left
    currentQuantumRemaining--;

    // apply priority decrease logic (it depends on running time)
    applyPriorityDecrease(currentProcess);

    // 5) After execution: check completion or quantum expiry
    if (currentProcess.burstTime === 0) {
      currentProcess.completedTime = simulationTime + 1; // since we executed this unit
      currentProcess.turnAroundTime =
        currentProcess.completedTime - currentProcess.arrivalTime;
      currentProcess.waitingTime =
        currentProcess.turnAroundTime - currentProcess.originalBurstTime;
      currentProcess.completed = true;
      completedList.push(currentProcess);
      currentProcess = null;
      currentQuantumRemaining = 0;
    } else if (currentQuantumRemaining === 0) {
      // quantum expired, requeue
      if (!queues[currentProcess.priority]) queues[currentProcess.priority] = [];
      queues[currentProcess.priority].push(currentProcess);
      currentProcess = null;
    } // else keep it as currentProcess for the next unit

    // 6) Increment waiting time for all processes currently in queues
    incrementWaitingForQueued();

    // 7) Advance time
    simulationTime++;

    // 8) Update displays
    drawGanttChart();
    drawPriorityQueues();

    // 9) If finished, update results
    if (
      allProcesses.length === 0 &&
      Object.values(queues).every((q) => q.length === 0) &&
      !currentProcess
    ) {
      updateResults();
    }
  }

  function incrementWaitingForQueued() {
    for (let pr in queues) {
      queues[pr].forEach((proc) => {
        if (!proc.completed) proc.waitingTime = (proc.waitingTime || 0) + 1;
      });
    }
  }

  function runFullSimulation() {
    while (
      allProcesses.length > 0 ||
      Object.values(queues).some((q) => q.length > 0) ||
      currentProcess
    ) {
      runNextUnit();
    }
    updateResults();
  }

  // ==========================
  // Drawing helpers (Gantt + Queues)
  // ==========================
  function drawPriorityQueues() {
    for (let pr = 1; pr <= 4; pr++) {
      let container = $(`#queue${pr} .queue-content`);
      container.empty();
      if (queues[pr] && queues[pr].length > 0) {
        queues[pr].forEach((p) => {
          let block = $('<div class="queue-block"></div>');
          block.text(`P${p.processID} (${p.burstTime})`);
          container.append(block);
        });
      }
    }
  }

  function drawGanttChart() {
    const container = $('#ganttChart');
    container.empty();

    let chartGrid = $('<div class="gantt-grid"></div>');
    chartGrid.css({
      display: 'grid',
      gridAutoFlow: 'column',
      gridAutoColumns: 'minmax(30px, 1fr)',
      textAlign: 'center',
    });

    for (let i = 0; i < schedule.length; i++) {
      let s = schedule[i];

      let cell = $('<div class="gantt-cell"></div>');
      cell.css({
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid #ddd',
        minWidth: '30px',
      });

      let block = $('<div class="gantt-block"></div>');
      block.css({
        flex: '1',
        backgroundColor: s.processId ? randomColor(s.processId) : '#ccc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '12px',
        minHeight: '30px',
      });
      block.text(s.processId ? 'P' + s.processId : 'Idle');

      let timeLabel = $('<div class="gantt-time"></div>');
      timeLabel.css({
        fontSize: '10px',
        borderTop: '1px solid #999',
      });
      timeLabel.text(s.start);

      cell.append(block);
      cell.append(timeLabel);
      chartGrid.append(cell);
    }

    container.append(chartGrid);
  }

  function randomColor(seed) {
    const colors = ['#007bff', '#28a745', '#dc3545', '#ffc107', '#17a2b8'];
    return colors[seed % colors.length];
  }

  // ==========================
  // Final results table
  // ==========================
  function updateResults() {
    completedList.sort((a, b) => a.processID - b.processID);
    $('#tblResults tbody').empty();

    completedList.forEach((p) => {
      $('#tblResults tbody').append(
        `<tr>
                    <td>${p.processID}</td>
                    <td>${p.arrivalTime}</td>
                    <td>${p.originalBurstTime}</td>
                    <td>${p.completedTime}</td>
                    <td>${p.waitingTime}</td>
                    <td>${p.turnAroundTime}</td>
                </tr>`
      );
    });

    // averages
    let totalTurnaround = 0,
      totalWaiting = 0,
      maxComplete = 0;
    completedList.forEach((p) => {
      totalTurnaround += p.turnAroundTime;
      totalWaiting += p.waitingTime;
      if (p.completedTime > maxComplete) maxComplete = p.completedTime;
    });

    $('#avgTurnaroundTime').val(
      completedList.length ? (totalTurnaround / completedList.length).toFixed(2) : ''
    );
    $('#avgWaitingTime').val(
      completedList.length ? (totalWaiting / completedList.length).toFixed(2) : ''
    );
    $('#throughput').val(
      completedList.length && maxComplete ? (completedList.length / maxComplete).toFixed(2) : ''
    );
  }
});
