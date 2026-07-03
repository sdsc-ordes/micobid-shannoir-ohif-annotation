import { Pipe, PipeTransform } from '@angular/core';
import { formatBytes } from '../data/mock-data';

@Pipe({ name: 'bytes' })
export class BytesPipe implements PipeTransform {
  transform(n: number): string { return formatBytes(n); }
}
