// Runs the HiGHS MILP solver off the main thread so the page stays responsive.
// The page creates a fresh worker per run and terminates it to cancel.
//
// Phase 1 (lp):  minimise the number of forts (preferred forts as tie-breaker).
// Phase 2 (lp2, optional): keep that fort count (the "__K__" placeholder) and maximise
//                the total defense score (terrain + trade-good local defensiveness).
importScripts('highs.js');

const highsReady = Module({ locateFile: (file) => file });

function chosenOf(res) {
  const out = [];
  for (const [name, col] of Object.entries(res.Columns || {})) {
    if (col.Primal > 0.5 && name.startsWith('x')) out.push(+name.slice(1));
  }
  return out;
}

self.onmessage = async (e) => {
  const { lp, lp2, timeLimit } = e.data;
  try {
    const highs = await highsReady;
    const t0 = performance.now();
    const opts = { time_limit: timeLimit, output_flag: false, mip_rel_gap: 0 };
    const res = highs.solve(lp, opts);
    const chosen = chosenOf(res);
    const msg = { ok: true, status: res.Status, chosen, chosen1: chosen, ms: 0 };
    if (lp2 && chosen.length) {
      try {
        const res2 = highs.solve(lp2.replace('__K__', String(chosen.length)), opts);
        msg.status2 = res2.Status;
        const c2 = chosenOf(res2);
        if (c2.length && c2.length <= chosen.length) msg.chosen = c2;
      } catch (err2) {
        msg.status2 = String(err2 && err2.message || err2);
      }
    }
    msg.ms = Math.round(performance.now() - t0);
    self.postMessage(msg);
  } catch (err) {
    self.postMessage({ ok: false, error: String(err && err.message || err) });
  }
};
