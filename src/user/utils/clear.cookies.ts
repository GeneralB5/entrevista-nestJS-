import { Response } from 'express';

export function clearAuthCookies(res: Response, cookieNames: string[]): void {
  const cookieOptions = {
    path: '/',
    httpOnly: true,
    secure: false, 
  };

  cookieNames.forEach(name => {
    res.clearCookie(name, cookieOptions);
  });
}