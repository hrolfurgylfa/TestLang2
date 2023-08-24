<script lang="ts">
  export let code: string;
  export function focusCode() {
    textarea?.focus();
  }

  let textarea: HTMLElement | undefined;
  $: textarea?.focus();
</script>

<div class="mb-6">
  <textarea bind:value={code} bind:this={textarea} class="w-full" />
</div>
