import expect from 'expect.js';

/**
 * Test the querying capabilities of dashboard, and make sure visualizations show the expected results, especially
 * with nested queries and filters on the visualizations themselves.
 */
export default function ({ getService, getPageObjects }) {
  const dashboardExpect = getService('dashboardExpect');
  const queryBar = getService('queryBar');
  const dashboardAddPanel = getService('dashboardAddPanel');
  const testSubjects = getService('testSubjects');
  const filterBar = getService('filterBar');
  const dashboardPanelActions = getService('dashboardPanelActions');
  const PageObjects = getPageObjects(['dashboard', 'header', 'visualize']);

  describe('dashboard filtering', async () => {
    before(async () => {
      await PageObjects.dashboard.gotoDashboardLandingPage();
    });

    describe('adding a filter that excludes all data', async () => {
      before(async () => {
        await PageObjects.dashboard.clickNewDashboard();
        await PageObjects.dashboard.setTimepickerIn63DataRange();
        await dashboardAddPanel.addEveryVisualization('"Filter Bytes Test"');
        await dashboardAddPanel.addEverySavedSearch('"Filter Bytes Test"');
        await dashboardAddPanel.closeAddPanel();
        await PageObjects.header.waitUntilLoadingHasFinished();
        await PageObjects.dashboard.waitForRenderComplete();
        await filterBar.addFilter('bytes', 'is', '12345678');
        await PageObjects.header.waitUntilLoadingHasFinished();
        await PageObjects.dashboard.waitForRenderComplete();
      });

      it('filters on pie charts', async () => {
        await dashboardExpect.pieSliceCount(0);
      });

      it('area, bar and heatmap charts filtered', async () => {
        await dashboardExpect.seriesElementCount(0);
      });

      it('data tables are filtered', async () => {
        await dashboardExpect.dataTableRowCount(0);
      });

      it('goal and guages are filtered', async () => {
        await dashboardExpect.goalAndGuageLabelsExist(['0', '0%']);
      });

      it('tsvb time series shows no data message', async () => {
        expect(await testSubjects.exists('noTSVBDataMessage')).to.be(true);
        await dashboardExpect.tsvbTimeSeriesLegendCount(0);
      });

      it('metric value shows no data', async () => {
        await dashboardExpect.metricValuesExist(['-']);
      });

      it('tag cloud values are filtered', async () => {
        await dashboardExpect.emptyTagCloudFound();
      });

      it('tsvb metric is filtered', async () => {
        await dashboardExpect.tsvbMetricValuesExist(['0 custom template']);
      });

      it('tsvb top n is filtered', async () => {
        await dashboardExpect.tsvbTopNValuesExist(['0', '0']);
      });

      it('saved search is filtered', async () => {
        await dashboardExpect.savedSearchRowCount(0);
      });

      it('timelion is filtered', async () => {
        await dashboardExpect.timelionLegendCount(0);
      });

      it('vega is filtered', async () => {
        await dashboardExpect.vegaTextsDoNotExist(['5,000']);
      });
    });


    describe('disabling a filter unfilters the data on', async () => {
      before(async () => {
        await testSubjects.click('disableFilter-bytes');
        await PageObjects.header.waitUntilLoadingHasFinished();
        await PageObjects.dashboard.waitForRenderComplete();
      });

      it('pie charts', async () => {
        await dashboardExpect.pieSliceCount(5);
      });

      it('area, bar and heatmap charts', async () => {
        await dashboardExpect.seriesElementCount(3);
      });

      it('data tables', async () => {
        await dashboardExpect.dataTableRowCount(10);
      });

      it('goal and guages', async () => {
        await dashboardExpect.goalAndGuageLabelsExist(['40%', '7,544']);
      });

      it('tsvb time series', async () => {
        expect(await testSubjects.exists('noTSVBDataMessage')).to.be(false);
        await dashboardExpect.tsvbTimeSeriesLegendCount(10);
      });

      it('metric value', async () => {
        await dashboardExpect.metricValuesExist(['101']);
      });

      it('tag cloud', async () => {
        await dashboardExpect.tagCloudWithValuesFound(['9,972', '4,886', '1,944', '9,025']);
      });

      it('tsvb metric', async () => {
        await dashboardExpect.tsvbMetricValuesExist(['50,465 custom template']);
      });

      it('tsvb top n', async () => {
        await dashboardExpect.tsvbTopNValuesExist(['6,308.13', '6,308.13']);
      });

      it('tsvb markdown', async () => {
        await dashboardExpect.tsvbMarkdownWithValuesExists(['7,209.29']);
      });

      it('saved searches', async () => {
        await dashboardExpect.savedSearchRowCount(1);
      });

      it('vega', async () => {
        await dashboardExpect.vegaTextsExist(['5,000']);
      });
    });

    describe('nested filtering', async () => {
      before(async () => {
        await PageObjects.dashboard.gotoDashboardLandingPage();
      });

      it('visualization saved with a query filters data', async () => {
        await PageObjects.dashboard.clickNewDashboard();
        await PageObjects.dashboard.setTimepickerIn63DataRange();

        await dashboardAddPanel.addVisualization('Rendering-Test:-animal-sounds-pie');
        await PageObjects.header.waitUntilLoadingHasFinished();
        await PageObjects.dashboard.waitForRenderComplete();
        await dashboardExpect.pieSliceCount(5);

        await dashboardPanelActions.clickEdit();
        await queryBar.setQuery('weightLbs:>50');
        await queryBar.submitQuery();

        await PageObjects.header.waitUntilLoadingHasFinished();
        await PageObjects.dashboard.waitForRenderComplete();
        await dashboardExpect.pieSliceCount(3);

        await PageObjects.visualize.saveVisualization('Rendering-Test:-animal-sounds-pie');
        await PageObjects.header.clickDashboard();
        await PageObjects.header.waitUntilLoadingHasFinished();
        await PageObjects.dashboard.waitForRenderComplete();
        await dashboardExpect.pieSliceCount(3);
      });

      it('Nested visualization filter pills filters data as expected', async () => {
        await dashboardPanelActions.clickEdit();
        await PageObjects.header.waitUntilLoadingHasFinished();
        await PageObjects.dashboard.waitForRenderComplete();
        await PageObjects.dashboard.filterOnPieSlice('grr');
        await PageObjects.header.waitUntilLoadingHasFinished();
        await dashboardExpect.pieSliceCount(1);

        await PageObjects.visualize.saveVisualization('animal sounds pie');
        await PageObjects.header.clickDashboard();

        await dashboardExpect.pieSliceCount(1);
      });

      it('Pie chart linked to saved search filters data', async () => {
        await dashboardAddPanel.addVisualization('Filter Test: animals: linked to search with filter');
        await dashboardExpect.pieSliceCount(3);
      });

      it('Pie chart linked to saved search filters shows no data with conflicting dashboard query', async () => {
        await queryBar.setQuery('weightLbs:<40');
        await queryBar.submitQuery();
        await PageObjects.dashboard.waitForRenderComplete();

        await dashboardExpect.pieSliceCount(0);
      });
    });
  });
}
