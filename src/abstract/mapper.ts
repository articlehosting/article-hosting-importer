import objectMapper from 'object-mapper';
import Logable from './logable';

abstract class Mapper<T> extends Logable {
  protected get schema(): T | undefined {
    return undefined;
  }

  public map<T>(source: any): T {
    if (!this.schema) {
      throw new Error('Scheme map is not defined!');
    }

    // @ts-ignore
    const result = objectMapper(source, this.schema);

    return <T>result;
  }
}

export default Mapper;
