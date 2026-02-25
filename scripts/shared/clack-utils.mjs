import { cancel, confirm, isCancel } from "@clack/prompts";

export function logSubline(message) {
  process.stdout.write(`|  ${message}\n`);
}

export async function promptOrExit(
  promise,
  cancelMessage = "Cancelled",
) {
  const result = await promise;
  if (isCancel(result)) {
    cancel(cancelMessage);
    process.exit(1);
  }
  return result;
}

export async function promptConfirm(
  message,
  initialValue,
  cancelMessage,
) {
  const result = await promptOrExit(
    confirm({ message, initialValue }),
    cancelMessage,
  );
  return result === true;
}
