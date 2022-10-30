import { nanoid } from 'nanoid';
import * as AWS from 'aws-sdk';
import { v2 } from 'cloudinary';

export class StorageService {
  constructor() {
    v2.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  AWS_S3_BUCKET = process.env.AWS_DEFAULT_S3_BUCKET;
  s3 = new AWS.S3({
    endpoint: 'https://sailspad.fra1.digitaloceanspaces.com',
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
    s3ForcePathStyle: true,
    region: process.env.AWS_S3_REGION,
  });

  async uploadFile(file: Buffer, mimetype: string) {
    return await this.s3_upload(file, this.AWS_S3_BUCKET, nanoid(), mimetype);
  }

  async s3_upload(file: Buffer, bucket: any, name: string, mimetype: string) {
    const params = {
      Bucket: bucket,
      Key: String(name),
      Body: file,
      ACL: 'public-read',
      ContentType: mimetype,
    };
    try {
      const s3Response = await this.s3.upload(params).promise();
      return s3Response.Location.replace(
        'http://localstack:4566',
        'http://localhost:4566',
      );
    } catch (e) {
      console.log(e);
    }
  }
}
