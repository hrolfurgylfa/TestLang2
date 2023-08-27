<script lang="ts">
  import { assertUnreachable } from "interpreter/src/helpers";
  import type { WorkerMessage } from "../execute.worker";

  export let code: string;

  let programOutput: Array<["log" | "err", string]> = [];
  let worker: Worker | undefined = undefined;

  function startWorker() {
    worker = new Worker(new URL("../execute.worker.ts", import.meta.url), {
      type: "module",
    });
    worker.postMessage(code);
    worker.addEventListener("message", (e) => {
      const data = e.data as WorkerMessage;
      switch (data.tag) {
        case "log":
          programOutput.push(["log", data.text]);
          programOutput = programOutput;
          break;
        case "err":
          programOutput.push(["err", data.text]);
          programOutput = programOutput;
          break;
        case "done":
          break;
        default:
          assertUnreachable(data);
      }
    });
  }

  const buttons: Array<[string, string, () => void]> = [
    ["Run", "bg-green-400", startWorker],
    ["Stop", "bg-red-400", worker?.terminate],
    ["Clear", "bg-gray-200", () => (programOutput = [])],
  ];
</script>

<div>
  <div class="grid grid-cols-3 gap-4">
    {#each buttons as [text, color, func]}
      <button on:click={func} class="px-4 py-1 {color} rounded-md">
        {text}
      </button>
    {/each}
  </div>
  <h4>Program Output:</h4>
  <div>
    {#each programOutput as [type, msg]}
      <p class={type == "log" ? "" : "bg-red-400"}>
        {msg}
      </p>
    {/each}
  </div>
</div>
