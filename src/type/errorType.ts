import { ObjectId } from 'mongodb';

export interface ErrorResponse {
	index: number;
	code: number;
	errmsg: string;
	errInfo: {
		failingDocumentId: ObjectId;
		details: unknown;
	};
}
