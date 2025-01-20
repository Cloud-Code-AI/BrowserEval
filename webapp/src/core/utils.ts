export const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

export function safeDivide(numerator: number, denominator: number): number {
    if (denominator === 0) {
        return 0;
    }
    return numerator / denominator
}


// Simple string formatting
export function formatString(template: string, ...args: string[]): string {
    return template.replace(/{(\d+)}/g, (match, index) => {
        const argIndex = parseInt(index, 10);
        return typeof args[argIndex] !== 'undefined' ? String(args[argIndex]) : match;
    });
}