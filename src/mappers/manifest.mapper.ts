import Mapper from '../abstract/mapper';

interface ManifestXmlAttribute {
  type: string,
  id: string,
  'media-type'?: string,
  href?: string,
}

interface ManifestXmlElement {
  type: 'element',
  name: string,
  elements: Array<ManifestXmlElement>,
  attributes?: ManifestXmlAttribute,
  text?: string,
}

export interface Manifest {
  elements: Array<ManifestXmlElement>,
}

export interface ManifestMapped {
  xmlFile?: string,
  pdfFile?: string,
  media?: Array<string>,
}

class ManifestMapper<T> extends Mapper<T> {
  protected get schema(): T {
    return <T><unknown>{
      'elements[1].elements[0].elements[1].attributes.href': 'xmlFile',
      'elements[1].elements[0].elements[2].attributes.href': 'pdfFile',
      'elements[1].elements': {
        key: 'media',
        transform: (value: Array<ManifestXmlElement>) => this.fetchFiles(value),
      },
    };
  }

  private fetchFiles(elements: Array<ManifestXmlElement>): Array<string> {
    const media: Array<string> = [];

    elements.forEach((element) => {
      element.elements.forEach((e) => {
        if (e.attributes && e.attributes.href) {
          if (e.attributes['media-type']) {
            media.push(e.attributes.href);
          }
        }
      });
    });

    return media;
  }
}

export default ManifestMapper;
