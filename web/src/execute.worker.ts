import { execute } from "interpreter";

export type LogMessage = { tag: "log", text: string };
export type ErrMessage = { tag: "err", text: string };
export type DoneMessage = { tag: "done" };
export type WorkerMessage = LogMessage | ErrMessage | DoneMessage;

onmessage = (e) => {
  const code: string = e.data;
  const log = (...data: unknown[]) => {
    const out = data.map(o => o.toString()).join(" ");
    postMessage({ tag: "log", text: out });
  }

  try {
    execute(code, { log });
  } catch (error: unknown) {
    postMessage({ tag: "err", text: error.toString() });
  }
  
  postMessage({ tag: "done" });
};
