<script lang="ts">
  export let code: string;

  const programs = [
    ["Comments", "comments.tstl"],
    ["Count", "count.tstl"],
    ["FizzBuzz", "fizzbuzz.tstl"],
    ["Loop", "loop.tstl"],
    ["Random", "random.tstl"],
  ];

  async function selectProgram(program: string) {
    console.log("Opening:", program);
    const url =
      "https://raw.githubusercontent.com/hrolfurgylfa/TestLang2/main/interpreter/tstl/";
    const res = await fetch(url + program);
    const newCode = await res.text();
    code = newCode;
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
