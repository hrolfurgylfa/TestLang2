<script lang="ts">
  const programs = [
    ["Comments", "comments.tstl"],
    ["Count", "count.tstl"],
    ["FizzBuzz", "fizzbuzz.tstl"],
    ["Loop", "loop.tstl"],
    ["Random", "random.tstl"],
  ];

  function selectProgram(program: string) {
    console.log("Opening:", program);
  }
</script>

<div>
  <h2 class="text-xl">Example programs:</h2>
  {#each programs as program}
    <button on:click={(_) => selectProgram(program[1])}>
      {program[0]}
    </button>
    <br />
  {/each}
</div>
