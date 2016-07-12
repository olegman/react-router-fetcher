import React from 'react';

class FetcherContext extends React.Component {
    constructor() {
        super();
        this.state = {
            canTransition: true
        };
    }
    componentWillMount() {
        fetchData({ props: this.props, filter: item => item.deferred, fetcherContext: this, firstLoad: true });
    }
    componentWillReceiveProps(nextProps) {
        fetchData({ props: nextProps, fetcherContext: this });
    }
    shouldComponentUpdate(nextProps, nextState) {
        return nextState.canTransition;
    }
    render() {
        return this.props.children;
    }
}

function fetchData({ props, filter, fetcherContext, firstLoad }) {
    let promises = [];
    let preloadPromises = [];
    let resultPromises = [];

    // get promises from components in flat array
    props.components.forEach(component => {
        if (component && Array.isArray(component.promises)) {
            promises = promises.concat(component.promises);
        }
    });

    // filter deferred items
    if (filter) promises = promises.filter(filter);

    // grouping
    let preloadCritical = false;
    promises.forEach(promise => {
        if (promise.preload) {
            preloadPromises.push(promise);
            if (promise.critical) preloadCritical = true;
        } else {
            resultPromises.push(promise);
        }
    });
    if (fetcherContext && preloadPromises.length) {
        fetcherContext.setState({
            canTransition: false
        });
    }

    // execute promises and return result
    resultPromises.push({
        promise: () => (
            runPromises(preloadPromises, props).then(value => {
                fetcherContext && fetcherContext.setState({
                    canTransition: true
                });
                return value;
            })
        ),
        critical: preloadCritical
    });

    return runPromises(resultPromises, props)
        .then(value => {
            if (!firstLoad && typeof props.successCb == 'function') props.successCb(value);
            return value;
        })
        .catch(error => {
            console.error('react-router-fetcher error', error);
            if (typeof props.errorCb == 'function') props.errorCb(error);
            throw error;
        });
}

function runPromises(promises, props) {
    return new Promise((resolve, reject) => {
        let pending = promises.length;
        if (pending == 0) resolve();
        function checkAndResolve(value) {
            pending--;
            if (pending == 0) resolve(value);
        }
        promises.forEach(promise => {
            promise.promise(props).then(value => {
                checkAndResolve(value);
                return value;
            }).catch(error => {
                if (promise.critical) {
                    reject(error);
                } else {
                    checkAndResolve(error);
                }
                throw error;
            })
        });
    });
}

export function fetchOnServer(props) {
    return fetchData({ props, filter: item => !item.deferred });
}

export function fetcher(items) {
    return Component => {
        Component.promises = items;
        return Component;
    };
}

export function useFetcher(options) {
    return {
        renderRouterContext: (child, props) => (
            <FetcherContext {...props} {...options}>
                {child}
            </FetcherContext>
        )
    };
}
