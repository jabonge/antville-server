import moment_timezone from 'moment-timezone';
import moment from 'moment';
import { koreaHolidays, nyseHolidays } from './holidays';
import { MarketStatus } from '../../domain/chart/koscom.service';

export function isNYSEOpen(): boolean {
  const nyTime = moment_timezone().tz('America/New_York');
  const day = nyTime.day();
  if (day === 0 || day === 6) return false;

  if (isHoliday(nyTime, 'US')) return false;

  const startTime = moment(nyTime)
    .set('hour', 9)
    .set('minute', 30)
    .set('second', 0);
  const closeTime = moment(nyTime)
    .set('hour', 16)
    .set('minute', 0)
    .set('second', 0);

  if (nyTime >= startTime && nyTime <= closeTime) return true;

  return false;
}

export function isIncludeUSIntraDayTime(
  nyNowTime: moment.Moment,
  nyUpdatedTime: moment.Moment,
): boolean {
  if (isHoliday(nyNowTime, 'US')) return false;
  const closeTime = moment(nyUpdatedTime)
    .set('hour', 16)
    .set('minute', 0)
    .set('second', 0);
  if (nyUpdatedTime < closeTime && nyNowTime > closeTime) {
    return true;
  }
  return false;
}

export function getKoreaMarketStatus(): MarketStatus {
  const koTime = moment_timezone().tz('Asia/Seoul');
  const day = koTime.day();
  if (day === 0 || day === 6) return MarketStatus.Holiday;

  if (isHoliday(koTime, 'KR')) return MarketStatus.Holiday;

  const startTime = moment(koTime)
    .set('hour', 9)
    .set('minute', 0)
    .set('second', 0);
  const closeTime = moment(koTime)
    .set('hour', 15)
    .set('minute', 30)
    .set('second', 0);
  if (koTime > startTime && koTime < closeTime) return MarketStatus.Open;
  if (koTime < startTime) {
    return MarketStatus.Pre;
  } else if (koTime > closeTime) {
    return MarketStatus.Post;
  }
}

export function isIncludeKoreaIntraDayTime(
  now: moment.Moment,
  updatedAt: moment.Moment,
): boolean {
  if (isHoliday(now, 'KR')) return false;
  const closeTime = moment(updatedAt)
    .set('hour', 15)
    .set('minute', 30)
    .set('second', 0);
  if (updatedAt < closeTime && now > closeTime) {
    return true;
  }
  return false;
}

export function isHoliday(now: moment.Moment, market: string): boolean {
  let holiday;
  switch (market) {
    case 'US':
      holiday = nyseHolidays;
      break;
    case 'KR':
      holiday = koreaHolidays;
  }

  const year = String(now.year());

  const month = String(now.month());

  if (holiday[year][month]) {
    const days = holiday[year][month];
    const nowDay = Number(now.format('DD'));
    const found = days.find((element: number) => element === nowDay);
    if (found !== undefined) return true;
  }

  return false;
}
