import { CronRunner } from '../src/runner';
import * as fs from 'fs';
import * as path from 'path';

// Mock node-cron
jest.mock('node-cron', () => ({
  schedule: jest.fn((schedule, callback) => ({
    stop: jest.fn(),
  })),
  validate: jest.fn((schedule) => {
    // Basic validation - check if it's a valid cron expression format
    const parts = schedule.split(' ');
    return parts.length === 5;
  }),
}));

const mockCron = require('node-cron');

describe('CronRunner', () => {
  const mockBaseUrl = 'http://localhost:3000';
  const mockConfigPath = '/tmp/test-vercel.json';
  const mockConfig = {
    crons: [
      { path: '/api/crons/test1', schedule: '* * * * *' },
      { path: '/api/crons/test2', schedule: '0 8 * * *' },
      { path: '/api/crons/notifications/test3', schedule: '*/5 * * * *' },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock fs.existsSync
    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    
    // Mock fs.readFileSync
    jest.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify(mockConfig));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should create instance with valid options', () => {
      const runner = new CronRunner({
        baseUrl: mockBaseUrl,
        cronSecret: 'test-secret',
      });

      expect(runner).toBeInstanceOf(CronRunner);
    });

    it('should throw error if baseUrl is missing', () => {
      expect(() => {
        new CronRunner({
          baseUrl: '',
        });
      }).toThrow('baseUrl is required');
    });

    it('should throw error if baseUrl is invalid', () => {
      expect(() => {
        new CronRunner({
          baseUrl: 'invalid-url',
        });
      }).toThrow('baseUrl must be a valid URL');
    });

    it('should use default configPath if not provided', () => {
      const runner = new CronRunner({
        baseUrl: mockBaseUrl,
      });

      expect(runner).toBeInstanceOf(CronRunner);
    });

    it('should use CRON_SECRET from environment if not provided', () => {
      process.env.CRON_SECRET = 'env-secret';
      
      const runner = new CronRunner({
        baseUrl: mockBaseUrl,
      });

      expect(runner).toBeInstanceOf(CronRunner);
      
      delete process.env.CRON_SECRET;
    });
  });

  describe('loadConfig', () => {
    it('should throw error if config file does not exist', async () => {
      jest.spyOn(fs, 'existsSync').mockReturnValue(false);

      const runner = new CronRunner({
        baseUrl: mockBaseUrl,
        configPath: '/non-existent/vercel.json',
      });

      await expect(runner.start()).rejects.toThrow('Config file not found');
    });

    it('should throw error if config is invalid JSON', async () => {
      jest.spyOn(fs, 'readFileSync').mockReturnValue('invalid json');

      const runner = new CronRunner({
        baseUrl: mockBaseUrl,
      });

      await expect(runner.start()).rejects.toThrow('Invalid JSON');
    });

    it('should throw error if config does not have crons array', async () => {
      jest.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify({ other: 'data' }));

      const runner = new CronRunner({
        baseUrl: mockBaseUrl,
      });

      await expect(runner.start()).rejects.toThrow('missing "crons" array');
    });
  });

  describe('start', () => {
    it('should start all cron jobs', async () => {
      const runner = new CronRunner({
        baseUrl: mockBaseUrl,
        cronSecret: 'test-secret',
      });

      await runner.start();

      expect(mockCron.schedule).toHaveBeenCalledTimes(3);
      expect(mockCron.validate).toHaveBeenCalledTimes(3);
    });

    it('should filter jobs based on filter pattern', async () => {
      const runner = new CronRunner({
        baseUrl: mockBaseUrl,
        filter: '/api/crons/notifications/*',
      });

      await runner.start();

      expect(mockCron.schedule).toHaveBeenCalledTimes(1);
    });

    it('should throw error if no jobs match filter', async () => {
      const runner = new CronRunner({
        baseUrl: mockBaseUrl,
        filter: '/api/crons/non-existent/*',
      });

      await expect(runner.start()).rejects.toThrow('No cron jobs found matching the filter');
    });

    it('should throw error for invalid cron schedule', async () => {
      mockCron.validate.mockReturnValue(false);

      const runner = new CronRunner({
        baseUrl: mockBaseUrl,
      });

      await expect(runner.start()).rejects.toThrow('Invalid cron schedule');
    });
  });

  describe('stop', () => {
    it('should stop all cron jobs', async () => {
      const mockStop = jest.fn();
      mockCron.schedule.mockReturnValue({ stop: mockStop });

      const runner = new CronRunner({
        baseUrl: mockBaseUrl,
      });

      await runner.start();
      runner.stop();

      expect(mockStop).toHaveBeenCalledTimes(3);
    });
  });

  describe('executeAll', () => {
    it('should execute all cron jobs once', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
      });

      const runner = new CronRunner({
        baseUrl: mockBaseUrl,
        cronSecret: 'test-secret',
        fetch: mockFetch as any,
      });

      const results = await runner.executeAll();

      expect(results).toHaveLength(3);
      expect(mockFetch).toHaveBeenCalledTimes(3);
      
      // Check that Authorization header is set
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-secret',
          }),
        })
      );
    });

    it('should execute filtered cron jobs', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
      });

      const runner = new CronRunner({
        baseUrl: mockBaseUrl,
        filter: '/api/crons/notifications/*',
        fetch: mockFetch as any,
      });

      const results = await runner.executeAll();

      expect(results).toHaveLength(1);
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/crons/notifications/test3',
        expect.any(Object)
      );
    });

    it('should handle failed requests', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
      });

      const runner = new CronRunner({
        baseUrl: mockBaseUrl,
        fetch: mockFetch as any,
      });

      const results = await runner.executeAll();

      expect(results).toHaveLength(3);
      expect(results.every(r => !r.success)).toBe(true);
      expect(results.every(r => r.statusCode === 500)).toBe(true);
    });

    it('should handle network errors', async () => {
      const mockFetch = jest.fn().mockRejectedValue(new Error('Network error'));

      const runner = new CronRunner({
        baseUrl: mockBaseUrl,
        fetch: mockFetch as any,
      });

      const results = await runner.executeAll();

      expect(results).toHaveLength(3);
      expect(results.every(r => !r.success)).toBe(true);
      expect(results.every(r => r.error === 'Network error')).toBe(true);
    });

    it('should not include Authorization header if cronSecret is not provided', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
      });

      const runner = new CronRunner({
        baseUrl: mockBaseUrl,
        fetch: mockFetch as any,
      });

      await runner.executeAll();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.not.objectContaining({
            'Authorization': expect.any(String),
          }),
        })
      );
    });
  });

  describe('executeOne', () => {
    it('should execute a specific cron job', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
      });

      const runner = new CronRunner({
        baseUrl: mockBaseUrl,
        fetch: mockFetch as any,
      });

      const result = await runner.executeOne('/api/crons/test1');

      expect(result.success).toBe(true);
      expect(result.path).toBe('/api/crons/test1');
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should throw error if cron job not found', async () => {
      const runner = new CronRunner({
        baseUrl: mockBaseUrl,
      });

      await expect(runner.executeOne('/api/crons/non-existent')).rejects.toThrow(
        'Cron job not found'
      );
    });
  });

  describe('getStats', () => {
    it('should return initial stats', () => {
      const runner = new CronRunner({
        baseUrl: mockBaseUrl,
      });

      const stats = runner.getStats();

      expect(stats).toEqual({
        totalJobs: 0,
        successfulExecutions: 0,
        failedExecutions: 0,
      });
    });

    it('should update stats after execution', async () => {
      const mockFetch = jest.fn()
        .mockResolvedValueOnce({ ok: true, status: 200 })
        .mockResolvedValueOnce({ ok: false, status: 500 })
        .mockResolvedValueOnce({ ok: true, status: 200 });

      const runner = new CronRunner({
        baseUrl: mockBaseUrl,
        fetch: mockFetch as any,
      });

      await runner.executeAll();
      const stats = runner.getStats();

      expect(stats.totalJobs).toBe(0); // Not set in executeAll
      expect(stats.successfulExecutions).toBe(2);
      expect(stats.failedExecutions).toBe(1);
      expect(stats.lastExecution).toBeInstanceOf(Date);
    });
  });

  describe('listJobs', () => {
    it('should list all configured jobs', () => {
      const runner = new CronRunner({
        baseUrl: mockBaseUrl,
      });

      const jobs = runner.listJobs();

      expect(jobs).toHaveLength(3);
      expect(jobs[0]).toEqual({ path: '/api/crons/test1', schedule: '* * * * *' });
    });

    it('should list filtered jobs', () => {
      const runner = new CronRunner({
        baseUrl: mockBaseUrl,
        filter: '/api/crons/notifications/*',
      });

      const jobs = runner.listJobs();

      expect(jobs).toHaveLength(1);
      expect(jobs[0].path).toBe('/api/crons/notifications/test3');
    });
  });

  describe('verbose logging', () => {
    it('should log when verbose is enabled', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const mockFetch = jest.fn().mockResolvedValue({ ok: true, status: 200 });

      const runner = new CronRunner({
        baseUrl: mockBaseUrl,
        verbose: true,
        fetch: mockFetch as any,
      });

      await runner.executeAll();

      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    it('should not log when verbose is disabled', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const mockFetch = jest.fn().mockResolvedValue({ ok: true, status: 200 });

      const runner = new CronRunner({
        baseUrl: mockBaseUrl,
        verbose: false,
        fetch: mockFetch as any,
      });

      await runner.executeAll();

      expect(consoleSpy).not.toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    it('should always log errors', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const mockFetch = jest.fn().mockResolvedValue({ ok: false, status: 500 });

      const runner = new CronRunner({
        baseUrl: mockBaseUrl,
        verbose: false,
        fetch: mockFetch as any,
      });

      await runner.executeAll();

      expect(consoleErrorSpy).toHaveBeenCalled();
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('execution results', () => {
    it('should include duration in results', async () => {
      const mockFetch = jest.fn().mockResolvedValue({ ok: true, status: 200 });

      const runner = new CronRunner({
        baseUrl: mockBaseUrl,
        fetch: mockFetch as any,
      });

      const results = await runner.executeAll();

      expect(results[0].duration).toBeGreaterThanOrEqual(0);
      expect(typeof results[0].duration).toBe('number');
    });

    it('should include timestamp in results', async () => {
      const mockFetch = jest.fn().mockResolvedValue({ ok: true, status: 200 });

      const runner = new CronRunner({
        baseUrl: mockBaseUrl,
        fetch: mockFetch as any,
      });

      const results = await runner.executeAll();

      expect(results[0].timestamp).toBeInstanceOf(Date);
    });

    it('should include schedule in results', async () => {
      const mockFetch = jest.fn().mockResolvedValue({ ok: true, status: 200 });

      const runner = new CronRunner({
        baseUrl: mockBaseUrl,
        fetch: mockFetch as any,
      });

      const results = await runner.executeAll();

      expect(results[0].schedule).toBe('* * * * *');
    });
  });
});
