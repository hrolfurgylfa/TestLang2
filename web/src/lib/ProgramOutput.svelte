<script lang="ts">
  export let code: string;

  import { execute } from "interpreter";

  let programOutput = "";
  const buttons: Array<[string, string, () => void]> = [
    [
      "Run",
      "bg-green-400",
      () => {
        execute(code, {
          log: (...data: unknown[]) => {
            const out = data.map((o) => o.toString());
            programOutput += out + "\n";
          },
        });
      },
    ],
    ["Stop", "bg-red-400", () => {}],
    [
      "Clear",
      "bg-gray-200",
      () => {
        programOutput = "";
      },
    ],
  ];
</script>

<div>
  <div class="grid grid-cols-3 gap-4">
    {#each buttons as button}
      <button on:click={button[2]} class="px-4 py-1 {button[1]} rounded-md">
        {button[0]}
      </button>
    {/each}
  </div>
  <h4>Program Output:</h4>
  <div>
    {#each programOutput.split("\n") as line}
      <p>{line}</p>
    {/each}
  </div>
</div>
