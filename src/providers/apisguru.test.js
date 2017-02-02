import { transformPath } from './apisguru';

describe('swagger', () => {
  describe('transformPath', () => {
    it('transforms path', () => {
      expect(transformPath('/locations/search')).to.eql('locations_search');
      expect(transformPath('/test/')).to.eql('test');
    });

    it('strips out path params', () => {
      expect(transformPath('/geographies/{geo-id}/media/recent')).to.eql('geographies_media_recent');
      expect(transformPath('/media/{media-id}/comments/{comment-id}')).to.eql('media_comments');
    });

    it('replaces special characters with underscores', () => {
      expect(transformPath('/test-x/search')).to.eql('test_x_search');
    });
  });
});
