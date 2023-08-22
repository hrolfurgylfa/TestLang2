<script lang="ts">
  import Examples from "./lib/Examples.svelte";
  import CodeEditor from "./lib/CodeEditor.svelte";
  import ProgramOutput from "./lib/ProgramOutput.svelte";
</script>

<main>
  <h1 class="text-3xl text-center mt-6">TestLang2</h1>

  <div class="grid grid-cols-3 gap-6 m-6">
    <div class="col-span-2">
      <CodeEditor />
      <ProgramOutput />
    </div>
    <Examples />
  </div>
</main>

<style>
</style>
