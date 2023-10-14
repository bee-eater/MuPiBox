import { Image } from '../current.image';

export interface CurrentShow {
    total?: number;
    items?: Item[];
}

export interface Item {
    duration_ms?: number;
    id?: string;
    name?: string;
    type?: string;
    images?: Image[];
}
