import { HttpException, HttpStatus } from '@nestjs/common';

export const imageFileFilter = (req, file, callback) => {
  if (!file.originalname.match(/\.(jpg|JPG|jpeg|png|gif)$/)) {
    return callback(
      new HttpException(
        'Only image files are allowed!',
        HttpStatus.BAD_REQUEST,
      ),
      false,
    );
  }
  callback(null, true);
};

export const editFileName = (req, file, callback) => {
  const nameWidth = file.originalname.split('.').length;
  const ext = file.originalname.split('.')[nameWidth - 1];
  const name = file.originalname.split('.')[0];
  callback(null, `${name}.${Date.now()}.${ext}`);
};