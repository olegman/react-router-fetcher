import React from 'react';

export class FetcherContext extends React.Component {
    componentWillReceiveProps(nextProps) {
        fetchData(nextProps);
    }
    render() {
        return this.props.children;
    }
}

export function fetchData(props) {
    let promises = [];
    props.components.forEach(component => {
        if (Array.isArray(component.promises)) {
            promises = promises.concat(component.promises);
        }
    });
    promises = promises.map(promise => promise.promise(props));
    // TODO: catch for govnars
    return Promise.all(promises);
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