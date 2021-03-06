const H = require('./helper.js');
const Parser = H.depJs('content/input-parser-default.js');

function getParams() {
  return {
    format: 'html',
    title: 'A awesome title',
    category: 'test',
    tags: ['tagA', 'tagB'],
    host: 'example.org',
    link: 'https://example.org/article/3.html',
    config: {
      saveDomainAsTag: false,
      rootFolder: 'mx-wc',
      assetPath: '$CLIPPING-PATH/assets',
      saveTitleAsFilename: false,
      defaultCategory: 'default',
      defaultClippingFolderFormat: '$FORMAT-A',
      titleStyleClippingFolderEnabled: false,
      titleStyleClippingFolderFormat: '$FORMAT-A',
    }
  }
}

describe('InputParserDefault', () => {

  it('should save title as filename', () => {
    const params = getParams();
    params.config.saveTitleAsFilename = true;
    const {info} = Parser.parse(params);
    const filename = info.filename.split('/').pop();
    H.assertEqual(filename, 'A-awesome-title.html');
  });

  it('should generate title style clipping folder $FORMAT-A', () => {
    const params = getParams();
    params.config.titleStyleClippingFolderEnabled = true;
    params.config.titleStyleClippingFolderFormat = '$FORMAT-A';
    const {storageInfo} = Parser.parse(params);
    const clippingFolder = storageInfo.saveFolder.split('/').pop();
    H.assertNotEqual(clippingFolder.match(/\d{9,}-A-awesome-title/), null)
  });

  it('should generate title style clipping folder $FORMAT-B', () => {
    const params = getParams();
    params.config.titleStyleClippingFolderEnabled = true;
    params.config.titleStyleClippingFolderFormat = '$FORMAT-B';
    const {storageInfo} = Parser.parse(params);
    const clippingFolder = storageInfo.saveFolder.split('/').pop();
    H.assertEqual(clippingFolder, 'A-awesome-title');
  });

  it('should use domain as default category', () => {
    const params = getParams();
    params.config.defaultCategory = "$DOMAIN";
    params.category = '';
    const {info} = Parser.parse(params);
    H.assertEqual(info.category, params.host);
  });

});
