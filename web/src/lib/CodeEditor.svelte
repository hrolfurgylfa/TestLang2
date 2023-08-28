<script lang="ts">
  export let code: string;
  export function focusCode() {
    editor.focus();
  }

  import * as ace from "ace-builds/src-noconflict/ace";

  let editor: AceAjax.Editor | undefined;
  function setupAce(node: HTMLDivElement) {
    editor = ace.edit("editor");
    editor.addEventListener("change", (e) => {
      code = editor.session.doc.getValue();
    });
    editor.focus();
  }
  $: if (editor && code != editor.session.doc.getValue())
    editor.session.doc.setValue(code);
</script>

<div class="mb-6">
  <div use:setupAce id="editor" class="w-full h-72" />
</div>
