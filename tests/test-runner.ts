/**
 * Test Runner
 * Core test execution engine with reporting
 */

export interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
  error?: string;
  details?: string;
}

export interface TestSuiteResult {
  suiteName: string;
  results: TestResult[];
  passed: number;
  failed: number;
  totalDuration: number;
}

export class TestRunner {
  private results: TestSuiteResult[] = [];
  private currentSuite: string = '';
  private suiteResults: TestResult[] = [];
  private suiteStartTime: number = 0;

  constructor(private verbose: boolean = true) {}

  startSuite(suiteName: string): void {
    this.currentSuite = suiteName;
    this.suiteResults = [];
    this.suiteStartTime = Date.now();
    if (this.verbose) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`  SUITE: ${suiteName}`);
      console.log('='.repeat(60));
    }
  }

  async runTest(
    name: string,
    testFn: () => Promise<void>
  ): Promise<TestResult> {
    const start = Date.now();
    const result: TestResult = { name, passed: true, duration: 0 };

    try {
      await testFn();
    } catch (error) {
      result.passed = false;
      result.error = error instanceof Error ? error.message : String(error);
    }

    result.duration = Date.now() - start;
    this.suiteResults.push(result);

    if (this.verbose) {
      const status = result.passed ? '✓' : '✗';
      console.log(`  ${status} ${name} (${result.duration}ms)`);
      if (!result.passed && result.error) {
        console.log(`    Error: ${result.error}`);
      }
    }

    return result;
  }

  endSuite(): TestSuiteResult {
    const totalDuration = Date.now() - this.suiteStartTime;
    const passed = this.suiteResults.filter((r) => r.passed).length;
    const failed = this.suiteResults.filter((r) => !r.passed).length;

    const suiteResult: TestSuiteResult = {
      suiteName: this.currentSuite,
      results: this.suiteResults,
      passed,
      failed,
      totalDuration,
    };

    this.results.push(suiteResult);

    if (this.verbose) {
      console.log(
        `\n  Suite Summary: ${passed} passed, ${failed} failed (${totalDuration}ms)`
      );
    }

    this.currentSuite = '';
    this.suiteResults = [];
    return suiteResult;
  }

  getReport(): string {
    const totalTests = this.results.reduce((acc, s) => acc + s.results.length, 0);
    const totalPassed = this.results.reduce((acc, s) => acc + s.passed, 0);
    const totalFailed = this.results.reduce((acc, s) => acc + s.failed, 0);
    const totalDuration = this.results.reduce((acc, s) => acc + s.totalDuration, 0);

    let report = '\n';
    report += '╔' + '═'.repeat(58) + '╗\n';
    report += '║' + 'TEST SUITE SUMMARY'.center(58) + '║\n';
    report += '╠' + '═'.repeat(58) + '╣\n';

    for (const suite of this.results) {
      const suiteStatus = suite.failed === 0 ? '✓' : '✗';
      report += `║ ${suiteStatus} ${suite.suiteName.padEnd(45)} ║\n`;
      report += `║   Passed: ${suite.passed.toString().padEnd(3)} Failed: ${suite.failed.toString().padEnd(3)} Duration: ${suite.totalDuration.toString().padStart(5)}ms`.padEnd(58) + '║\n';
    }

    report += '╠' + '═'.repeat(58) + '╣\n';
    const overallStatus = totalFailed === 0 ? 'PASSED' : 'FAILED';
    report += `║ Overall: ${overallStatus.padEnd(48)} ║\n`;
    report += `║ Total Tests: ${totalTests.toString().padEnd(45)} ║\n`;
    report += `║ Passed: ${totalPassed.toString().padEnd(50)} ║\n`;
    report += `║ Failed: ${totalFailed.toString().padEnd(50)} ║\n`;
    report += `║ Total Duration: ${totalDuration}ms`.padEnd(58) + '║\n';
    report += '╚' + '═'.repeat(58) + '╝\n';

    return report;
  }

  getResults(): TestSuiteResult[] {
    return this.results;
  }

  hasPassed(): boolean {
    return this.results.every((s) => s.failed === 0);
  }
}

String.prototype.center = function (length: number): string {
  const str = this.toString();
  const padding = length - str.length;
  if (padding <= 0) return str.slice(0, length);
  const left = Math.floor(padding / 2);
  const right = padding - left;
  return ' '.repeat(left) + str + ' '.repeat(right);
};

String.prototype.padEnd = function (length: number): string {
  const str = this.toString();
  return str.length < length ? str + ' '.repeat(length - str.length) : str.slice(0, length);
};

String.prototype.padStart = function (length: number): string {
  const str = this.toString();
  return str.length < length ? ' '.repeat(length - str.length) + str : str.slice(0, length);
};
