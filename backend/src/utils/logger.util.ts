/**
 * Simple logger utility
 */
class Logger {
    info(message: string, ...args: any[]): void {
        console.log(`[INFO] ${new Date().toISOString()} - ${message}`, ...args);
    }

    error(message: string, ...args: any[]): void {
        console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, ...args);
    }

    warn(message: string, ...args: any[]): void {
        console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, ...args);
    }

    debug(message: string, ...args: any[]): void {
        if (process.env.NODE_ENV !== 'production') {
            console.debug(`[DEBUG] ${new Date().toISOString()} - ${message}`, ...args);
        }
    }
}

export default new Logger();
