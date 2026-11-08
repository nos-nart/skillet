import { openFileDialog } from "@legendapp/spark/dialogs";

export async function pickDirectory(prompt = "Select folder"): Promise<string | null> {
  try {
    const result = await openFileDialog({
      selection: "directories",
      multiple: false,
      prompt,
    });
    if (result.canceled) {
      return null;
    }
    return result.paths[0] ?? null;
  } catch {
    return null;
  }
}
