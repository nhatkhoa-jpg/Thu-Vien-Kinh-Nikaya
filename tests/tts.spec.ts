import {test,expect} from '@playwright/test';

test('library Vietnamese voice survives multiple chunks and resumes without rerender',async({page,browserName})=>{
  const consoleErrors:string[]=[];
  page.on('console',msg=>{if(msg.type()==='error')consoleErrors.push(msg.text());});
  page.on('pageerror',error=>consoleErrors.push(error.message));

  await page.goto('/tts-e2e');
  await expect(page.getByRole('heading',{name:'V4.11.2 TTS E2E'})).toBeVisible();
  await page.getByRole('button',{name:'Nghe'}).click();

  const diag=page.getByTestId('tts-diagnostics');
  const stateWithError=async()=>`${await diag.getAttribute('data-state')}|${await diag.getAttribute('data-last-error')||''}`;
  await expect.poll(async()=>Number(await diag.getAttribute('data-audio-bytes')),{timeout:180_000}).toBeGreaterThan(20_000);
  await expect.poll(stateWithError,{timeout:60_000}).toBe('speaking|');
  const firstDuration=Number(await diag.getAttribute('data-audio-duration'));
  expect(firstDuration,`${browserName}: generated speech duration`).toBeGreaterThan(2);
  expect(firstDuration,`${browserName}: generated speech duration`).toBeLessThan(30);

  // Stop/resume must keep the already-rendered audio instead of starting synthesis from zero.
  await page.waitForTimeout(500);
  await page.getByTitle('Dừng').click();
  await expect.poll(async()=>await diag.getAttribute('data-state')).toBe('paused');
  const synthesisAtStop=Number(await diag.getAttribute('data-synthesis-count'));
  const chunkAtStop=Number(await diag.getAttribute('data-current-chunk'));
  await expect(page.getByRole('button',{name:'Đọc tiếp'})).toBeVisible();
  await page.getByRole('button',{name:'Đọc tiếp'}).click();
  await expect.poll(stateWithError,{timeout:30_000}).toBe('speaking|');
  await page.waitForTimeout(350);
  expect(Number(await diag.getAttribute('data-synthesis-count')),`${browserName}: resume must not rerender current chunk`).toBe(synthesisAtStop);
  expect(Number(await diag.getAttribute('data-current-chunk'))).toBe(chunkAtStop);

  // Regression gate: first chunk working is not enough. At least 3 chunks must finish in one session.
  await expect.poll(async()=>Number(await diag.getAttribute('data-completed-chunks')),{timeout:240_000}).toBeGreaterThanOrEqual(3);
  expect(await diag.getAttribute('data-state'),`${browserName}: final reader state; lastError=${await diag.getAttribute('data-last-error')}`).not.toBe('error');
  expect(Number(await diag.getAttribute('data-current-chunk'))).toBeGreaterThanOrEqual(3);
  expect(Number(await diag.getAttribute('data-synthesis-count'))).toBeGreaterThanOrEqual(4);

  const fatalErrors=consoleErrors.filter(text=>
    !text.includes('navigator.storage.getDirectory')&&
    !text.includes('storage.getDirectory')
  );
  expect(fatalErrors,`${browserName}: fatal browser errors`).toEqual([]);
});
