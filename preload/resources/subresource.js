function getSubresourceWithLinks({href, type}, links) {
    const params = new URLSearchParams();
    params.set('links', JSON.stringify(links.map(({href, as}) => `<${href}>;rel=preload;as=${as}`)));
    params.set('href', href);
    params.set('type', type);
    return `/preload/resources/subresource.py?${params.toString()}`;
}