/**
 * Test Reporter
 * Generates detailed test reports in various formats
 */

import { TestSuiteResult } from './test-runner.ts';

export type ReportFormat = 'console' | 'json' | 'html' | 'markdown';

export interface TestReport {
  timestamp: string;
  totalSuites: number;
  totalTests: number;
  passed: number;
  failed: number;
  duration: number;
  suites: TestSuiteResult[];
}

export class TestReporter {
  private format: ReportFormat;

  constructor(format: ReportFormat = 'console') {
    this.format = format;
  }

  generate(results: TestSuiteResult[], duration: number): string {
    const report: TestReport = {
      timestamp: new Date().toISOString(),
      totalSuites: results.length,
      totalTests: results.reduce((acc, s) => acc + s.results.length, 0),
      passed: results.reduce((acc, s) => acc + s.passed, 0),
      failed: results.reduce((acc, s) => acc + s.failed, 0),
      duration,
      suites: results,
    };

    switch (this.format) {
      case 'json':
        return this.generateJson(report);
      case 'html':
        return this.generateHtml(report);
      case 'markdown':
        return this.generateMarkdown(report);
      default:
        return this.generateConsole(report);
    }
  }

  private generateConsole(report: TestReport): string {
    let output = '\n';
    output += '╔' + '═'.repeat(58) + '╗\n';
    output += '║' + 'TEST SUITE REPORT'.center(58) + '║\n';
    output += '╠' + '═'.repeat(58) + '╣\n';
    output += `║ Timestamp: ${report.timestamp}`.padEnd(59) + '║\n';
    output += '╠' + '═'.repeat(58) + '╣\n';

    for (const suite of report.suites) {
      const suiteStatus = suite.failed === 0 ? '✓' : '✗';
      output += `║ ${suiteStatus} ${suite.suiteName}`.padEnd(59) + '║\n';
      output += `║   Tests: ${suite.results.length} | Passed: ${suite.passed} | Failed: ${suite.failed} | Duration: ${suite.totalDuration}ms`.padEnd(59) + '║\n';

      for (const result of suite.results) {
        const status = result.passed ? '✓' : '✗';
        output += `║     ${status} ${result.name} (${result.duration}ms)`.padEnd(59) + '║\n';
        if (!result.passed && result.error) {
          const errorMsg = `║       Error: ${result.error}`.slice(0, 58);
          output += errorMsg.padEnd(59) + '║\n';
        }
      }

      output += '╠' + '═'.repeat(58) + '╣\n';
    }

    const overallStatus = report.failed === 0 ? 'PASSED' : 'FAILED';
    output += `║ Overall: ${overallStatus}`.padEnd(59) + '║\n';
    output += `║ Total Tests: ${report.totalTests}`.padEnd(59) + '║\n';
    output += `║ Passed: ${report.passed}`.padEnd(59) + '║\n';
    output += `║ Failed: ${report.failed}`.padEnd(59) + '║\n';
    output += `║ Duration: ${report.duration}ms`.padEnd(59) + '║\n';
    output += '╚' + '═'.repeat(58) + '╝\n';

    return output;
  }

  private generateJson(report: TestReport): string {
    return JSON.stringify(report, null, 2);
  }

  private generateHtml(report: TestReport): string {
    const statusColor = (passed: boolean) => (passed ? '#28a745' : '#dc3545');
    const statusText = (passed: boolean) => (passed ? '✓' : '✗');

    let html = `
<!DOCTYPE html>
<html>
<head>
  <title>Test Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    .summary { background: #f5f5f5; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
    .suite { border: 1px solid #ddd; margin-bottom: 20px; border-radius: 5px; }
    .suite-header { background: #f8f9fa; padding: 10px; font-weight: bold; border-bottom: 1px solid #ddd; }
    .suite-content { padding: 10px; }
    .test { margin: 5px 0; padding: 5px; }
    .test.passed { color: #28a745; }
    .test.failed { color: #dc3545; }
    .error { color: #dc3545; font-size: 0.9em; margin-left: 20px; }
    .summary-stats { display: flex; gap: 20px; }
    .stat { text-align: center; }
    .stat-value { font-size: 24px; font-weight: bold; }
    .stat-label { color: #666; }
  </style>
</head>
<body>
  <h1>Integration Test Report</h1>
  <div class="summary">
    <div class="summary-stats">
      <div class="stat">
        <div class="stat-value" style="color: ${statusColor(report.failed === 0)}">${report.failed === 0 ? 'PASSED' : 'FAILED'}</div>
        <div class="stat-label">Overall Status</div>
      </div>
      <div class="stat">
        <div class="stat-value">${report.totalTests}</div>
        <div class="stat-label">Total Tests</div>
      </div>
      <div class="stat">
        <div class="stat-value" style="color: #28a745">${report.passed}</div>
        <div class="stat-label">Passed</div>
      </div>
      <div class="stat">
        <div class="stat-value" style="color: #dc3545">${report.failed}</div>
        <div class="stat-label">Failed</div>
      </div>
      <div class="stat">
        <div class="stat-value">${report.duration}ms</div>
        <div class="stat-label">Duration</div>
      </div>
    </div>
  </div>
  <h2>Test Suites</h2>
`;

    for (const suite of report.suites) {
      html += `
  <div class="suite">
    <div class="suite-header">
      ${statusText(suite.failed === 0)} ${suite.suiteName}
      (${suite.passed}/${suite.results.length} passed, ${suite.totalDuration}ms)
    </div>
    <div class="suite-content">
`;
      for (const result of suite.results) {
        html += `
      <div class="test ${result.passed ? 'passed' : 'failed'}">
        ${statusText(result.passed)} ${result.name} (${result.duration}ms)
        ${!result.passed && result.error ? `<div class="error">${result.error}</div>` : ''}
      </div>
`;
      }
      html += `
    </div>
  </div>
`;
    }

    html += `
  <p>Generated: ${report.timestamp}</p>
</body>
</html>`;

    return html;
  }

  private generateMarkdown(report: TestReport): string {
    let md = '# Integration Test Report\n\n';
    md += `**Generated:** ${report.timestamp}\n\n`;

    md += '## Summary\n\n';
    md += '| Metric | Value |\n';
    md += '|--------|-------|\n';
    md += `| Total Suites | ${report.totalSuites} |\n`;
    md += `| Total Tests | ${report.totalTests} |\n`;
    md += `| Passed | ${report.passed} |\n`;
    md += `| Failed | ${report.failed} |\n`;
    md += `| Duration | ${report.duration}ms |\n\n`;

    md += '## Test Suites\n\n';

    for (const suite of report.suites) {
      md += `### ${suite.failed === 0 ? '✓' : '✗'} ${suite.suiteName}\n\n`;
      md += `- **Tests:** ${suite.results.length}\n`;
      md += `- **Passed:** ${suite.passed}\n`;
      md += `- **Failed:** ${suite.failed}\n`;
      md += `- **Duration:** ${suite.totalDuration}ms\n\n`;
      md += '| Status | Test | Duration | Error |\n';
      md += '|--------|------|----------|-------|\n';

      for (const result of suite.results) {
        const status = result.passed ? '✓' : '✗';
        const error = result.error ? result.error.replace('|', '\\|') : '-';
        md += `| ${status} | ${result.name} | ${result.duration}ms | ${error} |\n`;
      }

      md += '\n';
    }

    return md;
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
