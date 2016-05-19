import React from 'react';

class FetcherContext extends React.Component {
    constructor() {
        super();
        this.state = {
            canTransition: true
        };
    }
    componentWillMount() {
        fetchData({ props: this.props, filter: item => item.deferred, fetcherContext: this });
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

function fetchData({ props, filter, fetcherContext }) {
    let promises = [];
    let preloadPromises = [];
    let rawPromises = [];

    // get promises from components in flat array
    props.components.forEach(component => {
        if (Array.isArray(component.promises)) {
            promises = promises.concat(component.promises);
        }
    });

    // filter deferred items
    if (filter) promises = promises.filter(filter);

    // prepare for execution
    promises.forEach(promise => {
        if (promise.preload) {
            preloadPromises.push(promise.promise(props))
        } else {
            rawPromises.push(promise.promise(props))
        }
    });
    if (fetcherContext && preloadPromises.length) {
        fetcherContext.setState({
            canTransition: false
        });
    }

    // execute promises and return result
    rawPromises.push(
        Promise.all(preloadPromises).then(() => {
            fetcherContext && fetcherContext.setState({
                canTransition: true
            });
        })
    );
    return Promise.all(rawPromises).catch(error => console.error('react-router-fetcher error', error));
    // promises = promises.map(promise => promise.promise(props));
    // return Promise.all(promises).catch(error => console.error('react-router-fetcher error', error));
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