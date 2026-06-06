import { useEffect } from 'react';

const SEO = ({ title, description, image, url }) => {
  useEffect(() => {
    if (title) {
      document.title = `${title} | TravelBharat - Discover India`;
    }

    const updateMetaTag = (name, content, attribute = 'name') => {
      if (!content) return;
      let el = document.querySelector(`meta[${attribute}="${name}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attribute, name);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    updateMetaTag('description', description || 'Explore India state by state. Find heritage places, spiritual shrines, valleys, and national parks.');
    updateMetaTag('og:title', title, 'property');
    updateMetaTag('og:description', description, 'property');
    
    if (image) {
      updateMetaTag('og:image', image, 'property');
    }
    if (url) {
      updateMetaTag('og:url', url, 'property');
    }
  }, [title, description, image, url]);

  return null; // Side-effect only
};

export default SEO;
