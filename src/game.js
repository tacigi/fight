function drawFighter(f) {
  const t = f.frame;
  const grounded = f.y >= CFG.GROUND;
  const walking = f.state === 'walk';
  const crouch = f.crouching && grounded;
  const bob = grounded && !crouch
    ? Math.sin(t * (walking ? 0.35 : 0.08)) * (walking ? 5 : 2)
    : 0;
  const facing = f.facing;
  const cx = f.x;
  const cy = f.y - bob;
  const color = f.data.color || '#e63946';
  const isKO = f.state === 'ko';
  const isHit = f.hitstun > 0 || f.stunTimer > 0;
  const isBlock = f.blocking && grounded;
  const isAttack = f.state === 'attack';
  const blink = f.invincible > 0 && Math.floor(t / 3) % 2 === 0;

  ctx.save();

  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(cx, CFG.GROUND + 4, crouch ? 42 : 34, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  if (isKO) {
    ctx.translate(cx, CFG.GROUND - 14);
    ctx.rotate(facing === 1 ? -Math.PI / 2 : Math.PI / 2);
    drawBody(0, 0, color, facing, { legSpread: 6, armSpread: 30, headTilt: 20 });
    ctx.restore();
    return;
  }

  ctx.translate(cx, cy);

  let lean = 0;
  if (isHit) lean = -facing * 8;
  if (!grounded) lean = facing * 4;
  if (isAttack && f.move) {
    const m = f.move;
    if (f.moveFrame >= m.startup && f.moveFrame < m.startup + m.active) lean = facing * 10;
  }

  const legPhase = walking ? Math.sin(t * 0.35) : 0;
  const pose = {
    legSpread: crouch
      ? 20
      : (grounded ? (walking ? 14 + legPhase * 10 : (isBlock ? 6 : 10)) : 4),
    armSpread: crouch ? 10 : (isBlock ? 4 : (isAttack ? 26 : 16)),
    headTilt: isHit ? -facing * 10 : 0,
    lean: crouch ? 0 : lean
  };

  // Saat menunduk: skala Y dikecilkan dari titik kaki agar badan membungkuk.
  if (crouch) {
    ctx.save();
    ctx.scale(1, 0.62);
    drawBody(0, 0, blink ? '#0ff' : color, facing, pose, { isBlock, isAttack, isHit, isCrouch: true });
    ctx.restore();
  } else {
    drawBody(0, 0, blink ? '#0ff' : color, facing, pose, { isBlock, isAttack, isHit });
  }

  // label nama (posisi menyesuaikan tinggi badan)
  const labelY = crouch ? -110 : -168;
  const avatarY = crouch ? -130 : -190;
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'center';
  ctx.shadowColor = '#000';
  ctx.shadowBlur = 3;
  ctx.fillText(f.data.name, 0, labelY);
  ctx.font = '18px sans-serif';
  ctx.fillText(f.data.avatar || '', 0, avatarY);
  ctx.shadowBlur = 0;
  ctx.textAlign = 'left';

  ctx.restore();

  const hb = f.activeHitbox;
  if (hb) {
    ctx.strokeStyle = 'rgba(255,60,60,0.85)';
    ctx.lineWidth = 2;
    ctx.strokeRect(hb.x, hb.y, hb.w, hb.h);
  }
}
