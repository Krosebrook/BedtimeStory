
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

export const logger = {
    info: (msg: string, data?: any) => {
        console.log(`[INFO] ${new Date().toISOString()} - ${msg}`, data || '');
    },
    error: (msg: string, err: any) => {
        console.error(`[ERROR] ${new Date().toISOString()} - ${msg}`, err);
    },
    warn: (msg: string, data?: any) => {
        console.warn(`[WARN] ${new Date().toISOString()} - ${msg}`, data || '');
    }
};
