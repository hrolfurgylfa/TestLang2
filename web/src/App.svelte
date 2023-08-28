<script lang="ts">
  import Examples from "./lib/Examples.svelte";
  import CodeEditor from "./lib/CodeEditor.svelte";
  import ProgramOutput from "./lib/ProgramOutput.svelte";

  let code = "";
  let codeChanged = false;
  $: codeChanged = code != "";

  let focusCode: () => void | undefined;
</script>

<main>
  <div>
    <h1 class="text-3xl text-center mt-6">TestLang2</h1>

    <div class="grid grid-cols-3 gap-6 m-6">
      <div class="col-span-2">
        <CodeEditor bind:code bind:focusCode />
        <ProgramOutput bind:code />
      </div>
      <Examples bind:code />
    </div>
  </div>
</main>

<style>
</style>
