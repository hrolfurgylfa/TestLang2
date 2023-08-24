<script lang="ts">
  export let code: string;

  const buttons: Array<[string, string, () => void]> = [
    ["Run", "bg-green-400", () => {}],
    ["Stop", "bg-red-400", () => {}],
    ["Clear", "bg-gray-200", () => {}],
  ];
  let programOutput = "<<<<<<";
</script>

<div>
  <div class="grid grid-cols-3 gap-4">
    {#each buttons as button}
      <button on:click={button[2]} class="px-4 py-1 {button[1]} rounded-md">
        {button[0]}
      </button>
    {/each}
  </div>
  <div>{programOutput}</div>
</div>
