/**
 * Rasid Character Images — Transparent PNG variants uploaded to CDN
 * Use these across the platform for consistent character rendering.
 */
export const RASID_CHARACTERS = {
  /** Arms crossed with red/white shmagh — confident pose */
  armsCrossedShmagh: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663296955420/qoUheMlVnqPiZdQe.png",
  /** Waving hand — friendly greeting pose */
  waving: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663296955420/trhmUCDmIUgvRfyf.png",
  /** Sunglasses with arms crossed — cool/professional pose */
  sunglasses: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663296955420/ksSaxPLmSvrLxHAg.png",
  /** Standing with red/white shmagh — neutral pose */
  shmagh: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663296955420/qnhkKZjJrOPcqgsf.png",
  /** Hands on hips — confident/ready pose */
  handsOnHips: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663296955420/pHcUGrMdEgCexGAn.png",
  /** Standing with red/white shmagh — full body */
  standingShmagh: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663296955420/JzZklqOoMNmtrCuP.png",
} as const;

/** Default character for login page */
export const LOGIN_CHARACTER = RASID_CHARACTERS.armsCrossedShmagh;

/** Default character for Smart Rasid AI chat */
export const AI_CHAT_CHARACTER = RASID_CHARACTERS.waving;

/** Default character for loading/welcome screens */
export const WELCOME_CHARACTER = RASID_CHARACTERS.handsOnHips;
