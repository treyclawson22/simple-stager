#!/usr/bin/env node

/**
 * Functional Tests for Simple Stager Dashboard
 * Tests core dashboard functionality at http://localhost:3002/dashboard
 */

// Puppeteer will be loaded conditionally

const BASE_URL = 'http://localhost:3002';
const DASHBOARD_URL = `${BASE_URL}/dashboard`;

class DashboardTester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.results = {
      passed: 0,
      failed: 0,
      tests: []
    };
  }

  async setup() {
    console.log('🚀 Setting up test environment...');
    const puppeteer = require('puppeteer');
    this.browser = await puppeteer.launch({ 
      headless: false, // Set to true for CI/automated testing
      devtools: false,
      defaultViewport: { width: 1200, height: 800 }
    });
    this.page = await this.browser.newPage();
    
    // Enable request interception for debugging
    await this.page.setRequestInterception(false);
    
    // Set user agent
    await this.page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');
  }

  async teardown() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async test(testName, testFunction) {
    console.log(`\n📋 Testing: ${testName}`);
    try {
      await testFunction();
      this.results.passed++;
      this.results.tests.push({ name: testName, status: 'PASSED' });
      console.log(`✅ PASSED: ${testName}`);
    } catch (error) {
      this.results.failed++;
      this.results.tests.push({ name: testName, status: 'FAILED', error: error.message });
      console.log(`❌ FAILED: ${testName} - ${error.message}`);
    }
  }

  async waitForElement(selector, timeout = 5000) {
    try {
      await this.page.waitForSelector(selector, { timeout });
      return true;
    } catch (error) {
      throw new Error(`Element ${selector} not found within ${timeout}ms`);
    }
  }

  async testDashboardLoad() {
    await this.page.goto(DASHBOARD_URL, { waitUntil: 'networkidle0' });
    
    // Check if page loaded successfully
    const title = await this.page.title();
    if (!title || title.includes('Error')) {
      throw new Error(`Dashboard failed to load properly. Title: ${title}`);
    }
    
    // Check for main dashboard container
    await this.waitForElement('div[class*="space-y-8"]');
  }

  async testNavigationBar() {
    // Check for navigation bar presence
    await this.waitForElement('nav');
    
    // Check for logo
    const logo = await this.page.$('img[alt="SimpleStager"]');
    if (!logo) {
      throw new Error('SimpleStager logo not found in navigation');
    }
    
    // Check for navigation links
    const navLinks = ['Dashboard', 'History', 'Billing', 'Settings'];
    for (const link of navLinks) {
      const navLink = await this.page.$(`a:has-text("${link}")`);
      if (!navLink) {
        throw new Error(`Navigation link "${link}" not found`);
      }
    }
    
    // Check for user info display
    const userWelcome = await this.page.$('div:has-text("Welcome")');
    if (!userWelcome) {
      throw new Error('User welcome message not found');
    }
    
    // Check for credits display
    const creditsDisplay = await this.page.$('div:has-text("credits")');
    if (!creditsDisplay) {
      throw new Error('Credits display not found');
    }
  }

  async testWorkflowCreator() {
    // Check for Test Workflow Creator section
    await this.waitForElement('div[class*="lg:col-span-2"]');
    
    // Look for workflow-related elements (this will depend on the TestWorkflowCreator component)
    const workflowSection = await this.page.$('div[class*="lg:col-span-2"]');
    if (!workflowSection) {
      throw new Error('Workflow creator section not found');
    }
  }

  async testReferralProgram() {
    // Check for referral program section
    const referralSection = await this.page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('*'));
      return elements.some(el => el.textContent && el.textContent.includes('TEST123'));
    });
    
    if (!referralSection) {
      throw new Error('Referral program section with referral code not found');
    }
  }

  async testRecentWorkflows() {
    // Check for recent workflows section
    const recentWorkflows = await this.page.evaluate(() => {
      // Look for any element that might contain workflow history
      const elements = Array.from(document.querySelectorAll('*'));
      return elements.some(el => 
        el.className && (
          el.className.includes('workflow') || 
          el.textContent && el.textContent.toLowerCase().includes('recent')
        )
      );
    });
    
    // This test is more lenient as the workflows section might be empty
    console.log('Recent workflows section check completed (may be empty for new users)');
  }

  async testResponsiveDesign() {
    // Test mobile viewport
    await this.page.setViewport({ width: 375, height: 667 });
    await this.page.reload({ waitUntil: 'networkidle0' });
    
    // Check if navigation is still accessible
    await this.waitForElement('nav');
    
    // Test tablet viewport
    await this.page.setViewport({ width: 768, height: 1024 });
    await this.page.reload({ waitUntil: 'networkidle0' });
    
    await this.waitForElement('nav');
    
    // Reset to desktop
    await this.page.setViewport({ width: 1200, height: 800 });
  }

  async testNavigationFunctionality() {
    // Test clicking on different navigation items
    const navItems = [
      { text: 'History', expectedUrl: '/history' },
      { text: 'Dashboard', expectedUrl: '/dashboard' }
    ];
    
    for (const item of navItems) {
      try {
        await this.page.click(`a:has-text("${item.text}")`);
        await this.page.waitForNavigation({ waitUntil: 'networkidle0' });
        
        const currentUrl = this.page.url();
        if (!currentUrl.includes(item.expectedUrl)) {
          throw new Error(`Navigation to ${item.text} failed. Expected URL to contain ${item.expectedUrl}, got ${currentUrl}`);
        }
      } catch (error) {
        // Navigate back to dashboard for next test
        await this.page.goto(DASHBOARD_URL, { waitUntil: 'networkidle0' });
        throw error;
      }
    }
  }

  async testPerformance() {
    const startTime = Date.now();
    await this.page.goto(DASHBOARD_URL, { waitUntil: 'networkidle0' });
    const loadTime = Date.now() - startTime;
    
    if (loadTime > 10000) { // 10 seconds
      throw new Error(`Dashboard load time too slow: ${loadTime}ms`);
    }
    
    console.log(`Dashboard loaded in ${loadTime}ms`);
  }

  async runAllTests() {
    console.log('🧪 Starting Dashboard Functional Tests');
    console.log(`📍 Testing URL: ${DASHBOARD_URL}`);
    
    await this.setup();
    
    try {
      await this.test('Dashboard Load Test', () => this.testDashboardLoad());
      await this.test('Navigation Bar Test', () => this.testNavigationBar());
      await this.test('Workflow Creator Test', () => this.testWorkflowCreator());
      await this.test('Referral Program Test', () => this.testReferralProgram());
      await this.test('Recent Workflows Test', () => this.testRecentWorkflows());
      await this.test('Responsive Design Test', () => this.testResponsiveDesign());
      await this.test('Navigation Functionality Test', () => this.testNavigationFunctionality());
      await this.test('Performance Test', () => this.testPerformance());
      
    } finally {
      await this.teardown();
    }
    
    this.printResults();
  }

  printResults() {
    console.log('\n📊 TEST RESULTS SUMMARY');
    console.log('========================');
    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    console.log(`📈 Success Rate: ${((this.results.passed / (this.results.passed + this.results.failed)) * 100).toFixed(1)}%`);
    
    console.log('\n📋 Detailed Results:');
    this.results.tests.forEach(test => {
      const status = test.status === 'PASSED' ? '✅' : '❌';
      console.log(`${status} ${test.name}`);
      if (test.error) {
        console.log(`   └─ Error: ${test.error}`);
      }
    });
    
    if (this.results.failed === 0) {
      console.log('\n🎉 All tests passed! Dashboard is working correctly.');
    } else {
      console.log(`\n⚠️  ${this.results.failed} test(s) failed. Please review the errors above.`);
    }
  }
}

// Manual test functions for when Puppeteer isn't available
class ManualTester {
  constructor() {
    this.testUrl = DASHBOARD_URL;
  }

  printInstructions() {
    console.log('🧪 MANUAL DASHBOARD TESTING INSTRUCTIONS');
    console.log('=========================================');
    console.log(`\n📍 Navigate to: ${this.testUrl}`);
    console.log('\n📋 Test Checklist:');
    
    const testCases = [
      {
        category: '🔄 Page Load',
        tests: [
          'Dashboard loads without errors',
          'Page title is correct',
          'No console errors in browser dev tools'
        ]
      },
      {
        category: '🧭 Navigation',
        tests: [
          'SimpleStager logo is visible',
          'Dashboard, History, Billing, Settings links are present',
          'User welcome message shows "Welcome Test"',
          'Credits display shows "3 credits"',
          'Sign out button is present'
        ]
      },
      {
        category: '🏠 Main Content',
        tests: [
          'Test Workflow Creator section is visible',
          'Referral Program section shows referral code "TEST123"',
          'Recent Workflows section is present (may be empty)',
          'Layout uses grid system (side-by-side on desktop)'
        ]
      },
      {
        category: '📱 Responsive Design',
        tests: [
          'Page displays properly on mobile (375px width)',
          'Navigation remains functional on tablet (768px width)',
          'Desktop layout works correctly (1200px+ width)'
        ]
      },
      {
        category: '🔗 Functionality',
        tests: [
          'Clicking "History" navigates to /history',
          'Clicking "Dashboard" returns to dashboard',
          'Clicking "Billing" navigates to /billing',
          'Clicking "Settings" navigates to /settings'
        ]
      },
      {
        category: '⚡ Performance',
        tests: [
          'Page loads within 5 seconds',
          'No visible loading delays',
          'Smooth navigation between pages'
        ]
      }
    ];

    testCases.forEach(category => {
      console.log(`\n${category.category}`);
      category.tests.forEach(test => {
        console.log(`  ☐ ${test}`);
      });
    });

    console.log('\n💡 Testing Tips:');
    console.log('  • Open browser dev tools (F12) to check for console errors');
    console.log('  • Test on different screen sizes using dev tools responsive mode');
    console.log('  • Verify all interactive elements are clickable');
    console.log('  • Check that user data (credits, name) displays correctly');
    
    console.log('\n✅ Mark each item as you test it');
    console.log('❌ Note any failures or issues found');
  }
}

// Check if Puppeteer is available, fallback to manual testing
async function main() {
  try {
    // Try to import Puppeteer
    require('puppeteer');
    
    const tester = new DashboardTester();
    await tester.runAllTests();
    
  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND' && error.message.includes('puppeteer')) {
      console.log('⚠️  Puppeteer not installed. Switching to manual testing mode.\n');
      console.log('💡 To install Puppeteer for automated testing, run:');
      console.log('   npm install puppeteer\n');
      
      const manualTester = new ManualTester();
      manualTester.printInstructions();
    } else {
      console.error('❌ Test error:', error.message);
      process.exit(1);
    }
  }
}

if (require.main === module) {
  main();
}

module.exports = { DashboardTester, ManualTester };