import statful from '../src/statful';
import StatfulUtil from '../src/statful-util';
import Metric from '../src/metric.model';

describe('Statful Client Unit testing', () => {
    afterEach(() => {
        window.performance.clearMarks();
        window.performance.clearMeasures();
    });

    it('should should have defaults', () => {
        statful.initialize();

        expect(statful.config.dryrun).toEqual(false);
        expect(statful.config.debug).toEqual(false);
        expect(statful.config.app).toEqual(undefined);
        expect(statful.config.tags).toEqual({});
        expect(statful.config.aggregations).toEqual([]);
        expect(statful.config.aggregationFrequency).toEqual(10);
        expect(statful.config.flushInterval).toEqual(10000);

        expect(statful.config.timer.tags).toEqual({unit: 'ms'});
        expect(statful.config.timer.aggregations).toEqual(['avg', 'p90', 'count']);

        expect(statful.config.counter.tags).toEqual({});
        expect(statful.config.counter.aggregations).toEqual(['sum', 'count']);

        expect(statful.config.gauge.tags).toEqual({});
        expect(statful.config.gauge.aggregations).toEqual(['last']);

        expect(statful.config.apiAddress).toEqual('https://beacon.statful.com');
    });

    it('should merge global, method, type tags and aggregations and override aggregation frequency', () => {
        statful.initialize({
            tags: {},
            aggregations: ['last'],
            timer: {tags: {foo: 'bar'}},
            gauge: {tags: {meh: 'yep'}, aggregations: ['derivative']}
        });

        let util = statful.util;

        spyOn(util, 'addMetricToQueue');

        let options = {
            tags: {mark: 'gauge'},
            agg: [],
            aggFreq: 300
        };

        statful.gauge('test', 1234, options);


        const metric = new Metric('test', 'gauge', 1234, options, statful.config);
        expect(util.addMetricToQueue).toHaveBeenCalledWith(metric);
    });

    it('should override aggregation frequency by type over global', () => {
        statful.initialize({
            tags: {},
            aggregations: ['last'],
            timer: {tags: {foo: 'bar'}},
            gauge: {tags: {meh: 'yep'}, aggregations: [], aggregationFrequency: 60}
        });

        let util = statful.util;

        spyOn(util, 'addMetricToQueue');

        let options = {
            tags: {mark: 'gauge'},
            agg: []
        };

        statful.gauge('test', 1234, options);

        const metric = new Metric('test', 'gauge', 1234, options, statful.config);
        expect(util.addMetricToQueue).toHaveBeenCalledWith(metric);
    });

    it('should override sample rate by type over global', () => {
        statful.initialize({
            tags: {},
            aggregations: ['last'],
            timer: {tags: {foo: 'bar'}},
            gauge: {tags: {meh: 'yep'}, aggregations: [], aggregationFrequency: 60}
        });

        let util = statful.util;

        spyOn(util, 'addMetricToQueue');

        let options = {
            tags: {mark: 'gauge'},
            agg: [],
            sampleRate: 50
        };

        statful.gauge('test', 1234, options);

        const metric = new Metric('test', 'gauge', 1234, options, statful.config);
        expect(util.addMetricToQueue).toHaveBeenCalledWith(metric);
    });

    it('should discard invalid aggregations', () => {
        statful.initialize({
            tags: {},
            aggregations: ['last', 'invalid'],
            timer: {tags: {foo: 'bar'}},
            gauge: {tags: {meh: 'yep'}, aggregations: []}
        });

        let util = statful.util;

        spyOn(util, 'addMetricToQueue');

        let options = {
            tags: {mark: 'gauge'},
            agg: ['fail'],
            aggFreq: 300
        };

        statful.gauge('test', 1234, options);

        const metric = new Metric('test', 'gauge', 1234, options, statful.config);
        expect(util.addMetricToQueue).toHaveBeenCalledWith(metric);
    });

    it('should discard invalid aggregation frequency', () => {
        statful.initialize({
            tags: {},
            aggregations: [],
            gauge: {tags: {meh: 'yep'}, aggregations: []}
        });

        let util = statful.util;

        spyOn(util, 'addMetricToQueue');

        let options = {
            tags: {mark: 'gauge'},
            aggFreq: 1234
        };

        statful.gauge('test', 1234, options);

        const metric = new Metric('test', 'gauge', 1234, options, statful.config);
        expect(util.addMetricToQueue).toHaveBeenCalledWith(metric);
    });

    it('should have an instance of StatfulUtil', () => {
        statful.initialize();
        let utilInstance = statful.util instanceof StatfulUtil;
        expect(utilInstance).toEqual(true);
    });

    it('should override default config', () => {
        statful.initialize({
            dryrun: true
        });

        expect(statful.config.dryrun).toEqual(true);
    });

    it('should return the duration of a measure when calling measureTimeUserTiming', () => {
        statful.initialize();

        statful.registerMark('start_test');
        statful.registerMark('end_test');

        let options = {
            startMark: 'start_test',
            endMark: 'end_test',
            clearMarks: false,
            clearMeasures: false
        };
        statful.registerMeasure('measure', 'metric', options);

        expect(statful.measureTimeUserTiming('measure')).toEqual(jasmine.any(Number));

        statful.clearMarks();
        statful.clearMeasures();
    });

    it('should clear all performance marks when calling clearMarks without arguments', () => {
        statful.initialize();

        statful.registerMark('start_test');

        spyOn(window.performance, 'clearMarks');

        statful.clearMarks();

        expect(window.performance.clearMarks).toHaveBeenCalled();
    });

    it('should clear performance marks when calling clearMarks with an Array of marks', () => {
        statful.initialize();

        statful.registerMark('start_test');

        spyOn(window.performance, 'clearMarks');

        statful.clearMarks(['start_test']);

        expect(window.performance.clearMarks).toHaveBeenCalledWith('start_test');
    });

    it('should clear all performance measures when calling clearMeasures without arguments', () => {
        statful.initialize();

        spyOn(window.performance, 'clearMeasures');

        statful.clearMeasures();

        expect(window.performance.clearMeasures).toHaveBeenCalled();
    });

    it('should clear performance measures when calling clearMeasures with an Array of measures', () => {
        statful.initialize();

        statful.registerMeasure('measure', 'metric');

        spyOn(window.performance, 'clearMarks');

        statful.clearMarks(['measure']);

        expect(window.performance.clearMarks).toHaveBeenCalledWith('measure');
    });

    it('should add a performance mark when calling registerMark', () => {
        statful.initialize();

        spyOn(window.performance, 'mark');

        statful.registerMark('mark_test');

        expect(window.performance.mark).toHaveBeenCalledWith('mark_test');
    });

    it('should add a performance measure when calling registerMeasure', () => {
        statful.initialize();

        spyOn(window.performance, 'measure');

        statful.registerMeasure('measure_test', 'metric_test');

        expect(window.performance.measure).toHaveBeenCalledWith('measure_test', undefined, jasmine.any(String));
    });

    it('should call addMetricToQueue when registerMeasure', () => {
        statful.initialize();

        statful.registerMark('start_test');

        setTimeout(() => {
            statful.registerMark('end_test');

            let util = statful.util;
            spyOn(util, 'addMetricToQueue');

            let options = {
                startMark: 'start_test',
                endMark: 'end_test',
                tags: {mark: 'measure'},
                aggregations: [],
                clearMarks: true,
                clearMeasures: true
            };
            statful.registerMeasure('measure_test', 'metric_test', options);

            expect(util.addMetricToQueue).toHaveBeenCalled();
        }, 50);
    });

    it('should call addMetricToQueue when registerMeasure with valid metric and default tags/aggregations', () => {
        statful.initialize();

        let util = statful.util;

        spyOn(util, 'addMetricToQueue');
        spyOn(statful, 'measureTimeUserTiming').and.returnValue(1000);

        let options = {
            tags: {mark: 'measure'},
            aggregations: []
        };

        statful.registerMeasure('measure_test', 'metric_test', options);

        const metric = new Metric('metric_test', 'timer', 1000, options, statful.config);
        expect(util.addMetricToQueue).toHaveBeenCalledWith(metric);
    });

    it('should call addMetricToQueue when timer', () => {
        statful.initialize();

        let util = statful.util;

        spyOn(util, 'addMetricToQueue');

        let options = {
            tags: {mark: 'foo'},
            agg: []
        };

        statful.timer('load', 1234, options);

        expect(util.addMetricToQueue).toHaveBeenCalled();
    });

    it('should not call addMetricToQueue when invalid timer', () => {
        statful.initialize();

        let util = statful.util;

        spyOn(util, 'addMetricToQueue');

        statful.timer();

        expect(util.addMetricToQueue.calls.count()).toEqual(0);
    });


    it('should call addMetricToQueue when counter', () => {
        statful.initialize();

        let util = statful.util;

        spyOn(util, 'addMetricToQueue');

        let options = {
            tags: {mark: 'foo'},
            agg: []
        };

        statful.counter('load', 1, options);

        expect(util.addMetricToQueue).toHaveBeenCalled();
    });

    it('should call addMetricToQueue when counter without value', () => {
        statful.initialize();

        let util = statful.util;

        spyOn(util, 'addMetricToQueue');

        statful.counter('load');

        expect(util.addMetricToQueue).toHaveBeenCalled();
    });

    it('should not call addMetricToQueue when invalid counter', () => {
        statful.initialize();

        let util = statful.util;

        spyOn(util, 'addMetricToQueue');

        statful.counter();

        expect(util.addMetricToQueue.calls.count()).toEqual(0);
    });

    it('should call addMetricToQueue when gauge with valid metric and default tags/aggregations', () => {
        statful.initialize();

        let util = statful.util;

        spyOn(util, 'addMetricToQueue');

        let options = {
            tags: {mark: 'gauge'},
            agg: [],
            aggFreq: 30
        };

        statful.gauge('test', 1234, options);

        const metric = new Metric('test', 'gauge', 1234, options, statful.config);
        expect(util.addMetricToQueue).toHaveBeenCalledWith(metric);
    });
});
