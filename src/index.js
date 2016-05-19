import React from 'react';

class FetcherContext extends React.Component {
    componentWillMount() {
        fetchData(this.props, item => item.deferred);
    }
    componentWillReceiveProps(nextProps) {
        fetchData(nextProps);
    }
    shouldComponentUpdate() {
        // TODO: block transition for some promises
        return true;
    }
    render() {
        return this.props.children;
    }
}

function fetchData(props, filter) {
    let promises = [];
    props.components.forEach(component => {
        if (Array.isArray(component.promises)) {
            promises = promises.concat(component.promises);
        }
    });
    if (filter) promises = promises.filter(filter);
    promises = promises.map(promise => promise.promise(props));
    return Promise.all(promises).catch(error => console.error('react-router-fetcher error', error));
}

export function fetchOnServer(props) {
    return fetchData(props, item => !item.deferred);
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