import ipaddress
import socket
from urllib.parse import urlparse
import warnings
from langchain_community.document_loaders import AsyncHtmlLoader
from langchain_community.document_transformers import BeautifulSoupTransformer
from langchain.tools import tool

warnings.filterwarnings("ignore", category=UserWarning)

@tool
def browse_link_content(url: str) -> str:
    """
    Visits a specific URL and returns its cleaned text content.
    Use this to verify live regulations or check portal updates mentioned in documents.
    """
    parsed = urlparse(url)
    if parsed.scheme != 'https' or not parsed.hostname:
        return 'Only HTTPS URLs are allowed.'
    try:
        addresses = socket.getaddrinfo(parsed.hostname, 443, type=socket.SOCK_STREAM)
        for address in addresses:
            ip = ipaddress.ip_address(address[4][0])
            if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved:
                return 'The requested host is not allowed.'
    except (socket.gaierror, ValueError):
        return 'The requested host could not be resolved.'

    print(f" Browsing: {url}...")
    try:
        # 1. Load the HTML content asynchronously
        loader = AsyncHtmlLoader([url])
        docs = loader.load()
        
        # 2. Extract meaningful text using BeautifulSoup
        # We focus on body text tags to remove headers, footers, and scripts
        bs_transformer = BeautifulSoupTransformer()
        docs_transformed = bs_transformer.transform_documents(
            docs, 
            tags_to_extract=["p", "h1", "h2", "h3", "li", "article"]
        )
        
        if not docs_transformed:
            return "The page was loaded but no meaningful text content could be extracted."
            
        content = docs_transformed[0].page_content.strip()
        
        # 3. Clean up whitespace and truncate for the Agent's context window
        clean_content = " ".join(content.split())
        
        limit = 5000
        if len(clean_content) > limit:
            return clean_content[:limit] + "\n\n[Content truncated for brevity...]"
        
        return clean_content

    except Exception as e:
        return f"Failed to browse URL '{url}': {str(e)}"

if __name__ == "__main__":
    # Test call
    target = "https://www.wikipedia.org"
    print(f"🔍 Testing Browser Tool...")
    result = browse_link_content.run(target)
    print(result[:500])
