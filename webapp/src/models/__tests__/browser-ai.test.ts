import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserAIModel } from '../browser-ai';

vi.mock('@browserai/browserai', () => ({
    BrowserAI: vi.fn().mockImplementation(() => ({
        loadModel: vi.fn().mockResolvedValue(undefined),
        generateText: vi.fn().mockResolvedValue('Generated text response')
    }))
}));

describe('BrowserAIModel', () => {
    let model: BrowserAIModel;
    const mockCallbacks = {
        onProgress: vi.fn(),
        onComplete: vi.fn(),
        onLog: vi.fn()
    };

    beforeEach(() => {
        vi.clearAllMocks();
        model = new BrowserAIModel({ model: 'test-model' }, mockCallbacks);
    });

    it('should evaluate dataset with progress updates', async () => {
        const metrics = await model.evaluate('test-dataset');
        
        expect(metrics).toBeDefined();
        expect(mockCallbacks.onProgress).toHaveBeenCalled();
        expect(mockCallbacks.onComplete).toHaveBeenCalled();
        expect(mockCallbacks.onLog).toHaveBeenCalled();
    });

    // ... other existing tests ...
}); 