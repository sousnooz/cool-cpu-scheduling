// app.js - full working scheduler with selectable algorithms + step-by-step
$(document).ready(function () {
  // ==========================
  // Variables Initialization
  // ==========================
  let processList = [];
  let schedule = [];
  let simulationTime = 0;

  // Simulation state for step-mode per algorithm (keeps local state)
  let simState = null;
  let runningStepMode = false;

  let allProcesses = [];
  let completedList = [];
  let quantum = 4;

  // Default processes (editable by user)
  let defaultProcesses = [
    { pid: 1, at: 1, bt: 20 },
    { pid: 2, at: 3, bt: 10 },
    { pid: 3, at: 5, bt: 2 },
  ];

  // build initial processList & table
  function initDefaultProcesses() {
    processList = [];
    $('#tblProcessList tbody').empty();
    defaultProcesses.forEach((p) => {
      let proc = {
        processID: p.pid,
        arrivalTime: p.at,
        burstTime: p.bt,
        originalBurstTime: p.bt,
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
            <td><button class="btn btn-danger btn-sm btnDelete">Delete</button></td>
         </tr>`
      );
    });

    // prefill input with next default ids
    $('#processID').val((defaultProcesses.length ? defaultProcesses[defaultProcesses.length - 1].pid + 1 : 1));
    $('#arrivalTime').val(defaultProcesses[0].at);
    $('#burstTime').val(defaultProcesses[0].bt);
  }
  initDefaultProcesses();

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

    // ==========================
// UI Interactions
// ==========================
$('#algorithmSelector').on('change', function () {
  const selected = $(this).val(); // use jQuery for consistency

  // Toggle the Time Quantum field visibility
  if (selected === 'optRR') {
    $('.form-group-time-quantum').slideDown(200);
  } else {
    $('.form-group-time-quantum').slideUp(200);
  }
});


    
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
        if (newValue < 0 || newValue > 1000) {
          alert('Arrival must be between 0 and 1000');
          $(this).text($(this).data('original-value') || '0');
          return;
        }
        break;
      case 2: // Burst
        if (newValue <= 0 || newValue > 1000) {
          alert('Burst must be 1..1000');
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
    if (at < 0 || at > 1000) {
      alert('Arrival 0..1000');
      return;
    }
    if (bt <= 0 || bt > 1000) {
      alert('Burst 1..1000');
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
            <td><button class="btn btn-danger btn-sm btnDelete">Delete</button></td>
        </tr>`
    );

    $('#processID').val(pid + 1);
    $('#arrivalTime').val('');
    $('#burstTime').val('');
  });

  // ==========================
  // Default params
  // ==========================
  $('#timeQuantum').val(4);

  // ==========================
  // Reset Simulation
  // ==========================
  function resetSimulation() {
    simulationTime = 0;
    schedule = [];
    completedList = [];
    simState = null;
    runningStepMode = false;

    // deep copy and initialize fields
    allProcesses = processList.map((p) => {
      return {
        processID: p.processID,
        arrivalTime: p.arrivalTime,
        burstTime: p.burstTime,
        originalBurstTime: p.originalBurstTime ?? p.burstTime,
        waitingTime: 0,
        lastExecutedAt: null,
        timeProcessed: 0,
        completed: false,
        timeSliceCounter: 0,
      };
    });

    // read params
    quantum = parseInt($('#timeQuantum').val()) || 4;
    if (isNaN(quantum) || quantum <= 0) {
      alert('Time Quantum must be a positive number!');
      return false;
    }

    // clear UI
    $('#tblResults tbody').empty();
    $('#ganttChart').empty();
    $('#avgTurnaroundTime').val('');
    $('#avgWaitingTime').val('');
    $('#throughput').val('');
    return true;
  }

  // ==========================
  // Drawing helpers (Gantt)
  // ==========================
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
    const colors = ['#007bff', '#28a745', '#dc3545', '#ffc107', '#17a2b8', '#6f42c1', '#e83e8c'];
    return colors[seed % colors.length];
  }

  // ==========================
  // Results
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

  // ==========================
  // Simulation framework per-algorithm:
  // Each algorithm exposes:
  //   init(state) - prepare the state
  //   step(state) - perform one time unit; returns {done:bool}
  //   runAll(state) - convenience full-run function
  // State object fields used:
  //   time, procs (not-yet-arrived), readyQueue, current, schedule, completed
  // ==========================
  function makeStateCopy() {
    return {
      time: 0,
      procs: processList.map((p) => ({
        processID: p.processID,
        arrivalTime: p.arrivalTime,
        burstTime: p.burstTime,
        originalBurstTime: p.originalBurstTime ?? p.burstTime,
      })).sort((a, b) => a.arrivalTime - b.arrivalTime),
      readyQueue: [],
      current: null,
      currentQuantumRemaining: 0,
      schedule: [],
      completed: [],
      quantum: quantum,
    };
  }

  // Helper: add arrivals at current time into readyQueue
  function addArrivalsToState(state) {
    for (let i = state.procs.length - 1; i >= 0; i--) {
      if (state.procs[i].arrivalTime <= state.time) {
        state.readyQueue.push(state.procs.splice(i, 1)[0]);
      }
    }
  }

  // FCFS
  const algFCFS = {
    init: (state) => {
      // nothing special
    },
    step: (state) => {
      // ensure arrivals
      addArrivalsToState(state);

      if (!state.current) {
        if (state.readyQueue.length === 0) {
          // idle for 1 unit
          state.schedule.push({ processId: null, start: state.time, duration: 1 });
          state.time++;
          return { done: state.procs.length === 0 && state.readyQueue.length === 0 && !state.current };
        }
        // pick first arrived
        state.current = state.readyQueue.shift();
        // set remaining time marker on 'current'
        state.current._remaining = state.current.burstTime;
      }

      // execute 1 unit
      state.schedule.push({ processId: state.current.processID, start: state.time, duration: 1 });
      state.current._remaining -= 1;
      state.time++;

      if (state.current._remaining === 0) {
        state.current.completedTime = state.time;
        state.current.turnAroundTime = state.current.completedTime - state.current.arrivalTime;
        state.current.waitingTime = state.current.turnAroundTime - state.current.originalBurstTime;
        state.completed.push(state.current);
        state.current = null;
      }
      // add new arrivals that may have appeared during this unit
      addArrivalsToState(state);
      return { done: state.procs.length === 0 && state.readyQueue.length === 0 && !state.current };
    },
    runAll: (state) => {
      while (true) {
        let res = algFCFS.step(state);
        if (res.done) break;
      }
    },
  };

  // SJF (non-preemptive)
  const algSJF = {
    init: (state) => {},
    step: (state) => {
      addArrivalsToState(state);

      if (!state.current) {
        if (state.readyQueue.length === 0) {
          state.schedule.push({ processId: null, start: state.time, duration: 1 });
          state.time++;
          return { done: state.procs.length === 0 && state.readyQueue.length === 0 && !state.current };
        }
        // pick shortest burst
        state.readyQueue.sort((a, b) => a.burstTime - b.burstTime || a.arrivalTime - b.arrivalTime);
        state.current = state.readyQueue.shift();
        state.current._remaining = state.current.burstTime;
      }

      // execute 1 unit
      state.schedule.push({ processId: state.current.processID, start: state.time, duration: 1 });
      state.current._remaining--;
      state.time++;

      if (state.current._remaining === 0) {
        state.current.completedTime = state.time;
        state.current.turnAroundTime = state.current.completedTime - state.current.arrivalTime;
        state.current.waitingTime = state.current.turnAroundTime - state.current.originalBurstTime;
        state.completed.push(state.current);
        state.current = null;
      }
      addArrivalsToState(state);
      return { done: state.procs.length === 0 && state.readyQueue.length === 0 && !state.current };
    },
    runAll: (state) => {
      while (true) {
        let res = algSJF.step(state);
        if (res.done) break;
      }
    },
  };

  // SRTF (preemptive SJF)
  const algSRTF = {
    init: (state) => {},
    step: (state) => {
      // add arrivals at current time
      addArrivalsToState(state);

      // if no ready and no procs, idle
      if (state.readyQueue.length === 0 && state.procs.length === 0 && !state.current) {
        return { done: true };
      }

      // push current back to readyQueue if exists
      if (state.current) {
        // keep the current in readyQueue as candidate (it still has remaining)
        // but we will also add arrivals and then select shortest remaining
        state.current._remaining = state.current._remaining ?? state.current.burstTime;
        state.readyQueue.push(state.current);
        state.current = null;
      }

      if (state.readyQueue.length === 0) {
        // CPU idle for 1
        state.schedule.push({ processId: null, start: state.time, duration: 1 });
        state.time++;
        addArrivalsToState(state);
        return { done: state.procs.length === 0 && state.readyQueue.length === 0 && !state.current };
      }

      // pick shortest remaining
      state.readyQueue.sort((a, b) => (a._remaining ?? a.burstTime) - (b._remaining ?? b.burstTime) || a.arrivalTime - b.arrivalTime);
      state.current = state.readyQueue.shift();
      state.current._remaining = state.current._remaining ?? state.current.burstTime;

      // execute 1 unit
      state.schedule.push({ processId: state.current.processID, start: state.time, duration: 1 });
      state.current._remaining -= 1;
      state.time++;

      if (state.current._remaining === 0) {
        state.current.completedTime = state.time;
        state.current.turnAroundTime = state.current.completedTime - state.current.arrivalTime;
        state.current.waitingTime = state.current.turnAroundTime - state.current.originalBurstTime;
        state.completed.push(state.current);
        state.current = null;
      } else {
        // keep as candidate (we'll push back in next step)
        // but we already push it after this step via loop logic
      }
      addArrivalsToState(state);
      return { done: state.procs.length === 0 && state.readyQueue.length === 0 && !state.current };
    },
    runAll: (state) => {
      while (true) {
        let res = algSRTF.step(state);
        if (res.done) break;
      }
    },
  };

  // Round Robin
  const algRR = {
    init: (state) => {
      state.quantum = state.quantum || quantum || 4;
    },
    step: (state) => {
      addArrivalsToState(state);

      if (!state.current) {
        if (state.readyQueue.length === 0) {
          // idle
          if (state.procs.length === 0) {
            return { done: state.readyQueue.length === 0 && !state.current };
          }
          state.schedule.push({ processId: null, start: state.time, duration: 1 });
          state.time++;
          return { done: false };
        }
        state.current = state.readyQueue.shift();
        state.current._remaining = state.current._remaining ?? state.current.burstTime;
        state.current._quantumUsed = 0;
      }

      // execute 1 unit
      state.schedule.push({ processId: state.current.processID, start: state.time, duration: 1 });
      state.current._remaining -= 1;
      state.current._quantumUsed += 1;
      state.time++;

      // arrivals that appear during this unit
      addArrivalsToState(state);

      if (state.current._remaining === 0) {
        state.current.completedTime = state.time;
        state.current.turnAroundTime = state.current.completedTime - state.current.arrivalTime;
        state.current.waitingTime = state.current.turnAroundTime - state.current.originalBurstTime;
        state.completed.push(state.current);
        state.current = null;
      } else if (state.current._quantumUsed >= (state.quantum || 4)) {
        // quantum expired -> push to end of readyQueue
        state.readyQueue.push(state.current);
        state.current = null;
      }
      return { done: state.procs.length === 0 && state.readyQueue.length === 0 && !state.current };
    },
    runAll: (state) => {
      while (true) {
        let res = algRR.step(state);
        if (res.done) break;
      }
    },
  };

  // algorithms map
  const algorithms = {
    optFCFS: algFCFS,
    optSJF: algSJF,
    optSRTF: algSRTF,
    optRR: algRR,
  };

  // ==========================
  // Buttons wiring
  // ==========================
  $('#btnCalculate').on('click', function () {
    if (processList.length === 0) {
      alert('Insert some processes first!');
      return;
    }
    if (!resetSimulation()) return;

    $('#nextBtnWrapper').hide();

    const selectedAlgorithm = $('#algorithm').val() || 'optFCFS';
    const alg = algorithms[selectedAlgorithm];
    if (!alg) {
      alert('Unknown algorithm selected!');
      return;
    }

    // prepare state
    let state = makeStateCopy();
    // initialize algorithm
    if (alg.init) alg.init(state);
    // run all
    alg.runAll(state);

    // finalize results
    schedule = state.schedule;
    completedList = state.completed;
    // make sure waiting/turnaround computed (algorithms compute them already)
    drawGanttChart();
    updateResults();
  });

  $('#btnStepByStep').on('click', function () {
    if (processList.length === 0) {
      alert('Insert some processes first!');
      return;
    }
    if (!resetSimulation()) return;

    $('#nextBtnWrapper').show();

    // start step-mode
    runningStepMode = true;
    const selectedAlgorithm = $('#algorithm').val() || 'optFCFS';
    const alg = algorithms[selectedAlgorithm];
    if (!alg) {
      alert('Unknown algorithm selected!');
      return;
    }

    simState = makeStateCopy();
    if (alg.init) alg.init(simState);
    simState._alg = alg; // attach for step-by-step
    // draw initial UI
    schedule = simState.schedule;
    drawGanttChart();
  });

  $('#btnNextTime').on('click', function () {
    if (!runningStepMode || !simState) {
      alert('Step-by-step not started. Click "Step-by-step" first.');
      return;
    }

    let result = simState._alg.step(simState);
    schedule = simState.schedule.slice(); // live copy
    drawGanttChart();

    // If done, finalize and stop
    if (result.done) {
      runningStepMode = false;
      completedList = simState.completed.slice();
      updateResults();
      $('#nextBtnWrapper').hide();
      alert('Simulation completed!');
    }
  });

  // ==========================
  // Utility: when table is updated, keep processList sync (if user edits cells)
  // (optional: use a 'Refresh' button instead of continuous sync)
  // ==========================
  $('#btnRefreshTable').on('click', function () {
    // rebuild processList from table rows
    const newList = [];
    $('#tblProcessList tbody tr').each(function () {
      const cols = $(this).find('td');
      const pid = parseInt(cols.eq(0).text());
      const at = parseInt(cols.eq(1).text());
      const bt = parseInt(cols.eq(2).text());
      const pr = parseInt(cols.eq(3).text());
      if (!isNaN(pid) && !isNaN(at) && !isNaN(bt) && !isNaN(pr)) {
        newList.push({
          processID: pid,
          arrivalTime: at,
          burstTime: bt,
          originalBurstTime: bt,
          waitingTime: 0,
          lastExecutedAt: null,
          timeProcessed: 0,
          completed: false,
          timeSliceCounter: 0,
        });
      }
    });
    processList = newList;
    alert('Process list refreshed from table.');
  });

  // if you want auto refresh when table changes uncomment this (but it's noisy):
  // $('#tblProcessList').on('blur', 'td[contenteditable="true"]', function () { $('#btnRefreshTable').click(); });

});
