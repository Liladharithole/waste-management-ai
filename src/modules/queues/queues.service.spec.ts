import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { QueuesService } from './queues.service';

describe('QueuesService', () => {
  let service: QueuesService;
  let mockReportsQueue: any;
  let mockBillingQueue: any;

  beforeEach(async () => {
    mockReportsQueue = {
      add: jest.fn().mockResolvedValue({ id: 'job_101' }),
      getJob: jest.fn(),
    };
    mockBillingQueue = {
      add: jest.fn().mockResolvedValue({ id: 'job_202' }),
      getJob: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QueuesService,
        { provide: getQueueToken('reports-queue'), useValue: mockReportsQueue },
        { provide: getQueueToken('billing-queue'), useValue: mockBillingQueue },
      ],
    }).compile();

    service = module.get<QueuesService>(QueuesService);
  });

  it('should enqueue a report export job in BullMQ', async () => {
    const result = await service.addReportExportJob({
      reportType: 'waste-collections',
      format: 'csv',
      requestedByUserId: 1,
    });

    expect(result.jobId).toBe('job_101');
    expect(result.status).toBe('QUEUED');
    expect(mockReportsQueue.add).toHaveBeenCalled();
  });

  it('should enqueue a monthly billing job in BullMQ', async () => {
    const result = await service.addBillingJob({
      billingMonth: '2026-08',
      initiatedByUserId: 1,
    });

    expect(result.jobId).toBe('job_202');
    expect(result.status).toBe('QUEUED');
    expect(mockBillingQueue.add).toHaveBeenCalled();
  });

  it('should query job progress and state', async () => {
    mockReportsQueue.getJob.mockResolvedValue({
      id: 'job_101',
      getState: jest.fn().mockResolvedValue('completed'),
      progress: 100,
      returnvalue: { downloadUrl: 'https://s3.amazonaws.com/test.csv' },
    });

    const result = await service.getJobStatus('job_101', 'reports-queue');

    expect(result.jobId).toBe('job_101');
    expect(result.state).toBe('completed');
    expect(result.progress).toBe(100);
  });
});
