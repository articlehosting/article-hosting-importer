import path from 'path';
import Processor from '../abstract/processor';
import FileModel from '../models/file.model';
import XmlFileModel from '../models/xml-file.model';

interface ManifestContentItemInstance {
  '$': {
    'media-type': string,
    href: string,
  }
}

interface ManifestContentItem {
  title: Array<string>,
  instance: Array<ManifestContentItemInstance>
}

export interface ManifestContent {
  manifest: {
    item: Array<ManifestContentItem>,
  }
}

class ManifestProcessor extends Processor {
  public readonly MANIFEST_FILE = 'manifest.xml';

  public readonly MANIFEST_MEDIA_TYPES = {
    APP_XML: 'application/xml',
  };

  public processManifestContents(manifestContent: ManifestContent, zipContents: Array<FileModel>): Array<FileModel> {
    const files: Array<FileModel> = [];

    manifestContent.manifest.item.forEach((item) => {
      const { instance } = item;

      instance.forEach((i) => {
        const instanceItem = i.$;

        if (instanceItem['media-type'] === this.MANIFEST_MEDIA_TYPES.APP_XML) {
          // select xml file from zip contents based manifest content.
          const xmlFile = zipContents.find((file) => file.basename === path.basename(instanceItem.href));

          if (xmlFile) {
            files.push(new XmlFileModel(this.logger, { filePath: xmlFile.filePath }));
          }
        } else {
          const manifestedFile = zipContents.find((file) => file.basename === path.basename(instanceItem.href));

          if (manifestedFile) {
            files.push(manifestedFile);
          }
        }
      });
    });

    return files;
  }
}

export default ManifestProcessor;
