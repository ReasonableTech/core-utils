import {
  promptOrExit as _promptOrExit,
  promptConfirm as _promptConfirm,
  logSubline,
} from "../../shared/clack-utils.mjs";

export { logSubline };

export async function promptOrExit(promise) {
  return await _promptOrExit(promise, "Bootstrap cancelled");
}

export async function promptConfirm(message, initialValue) {
  return await _promptConfirm(message, initialValue, "Bootstrap cancelled");
}
