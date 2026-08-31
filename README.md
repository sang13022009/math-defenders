# Math Defenders

**Family Prototype V0.1** — Tower Defense × Roguelite Boss Battle × Adaptive Math.

Mục tiêu đầu tiên: tạo một game đủ vui để trẻ lớp 1–4 chủ động muốn chơi lại, trong khi tiến bộ trong game phải gắn với việc giải Toán thật.

## Product pillars

1. **Game first** — trận đấu phải vui ngay cả khi bỏ nhãn “giáo dục”.
2. **Math = Power** — giải Toán tạo Math Energy, mở skill, phá giáp boss và nâng cấp tower.
3. **Short runs** — một run mục tiêu 8–12 phút.
4. **Adaptive practice** — theo dõi accuracy/mastery theo skill, không random câu vô nghĩa.
5. **Family friendly** — nhiều profile local, không máu me, ưu tiên hợp tác thay vì bêu điểm thấp.
6. **Spectacle with hierarchy** — hiệu ứng lớn dành cho streak, boss phase và ultimate, không spam mọi câu.

## V0.1 scope

- 1 battlefield: Mecha City.
- 3 loại tower: Flame / Volt / Frost.
- 4 loại enemy + 1 boss.
- Math Energy loop.
- Hero skill / ultimate cơ bản.
- Question generator theo lớp 1–4.
- Hint khi sai.
- Local profile + mastery stats.
- Wave → upgrade → boss → victory report.
- Vector placeholder art để test gameplay trước khi đầu tư asset thật.

## Run locally

```bash
npm install
npm run dev
```

Sau đó mở URL Vite hiển thị trong terminal.

## Stack

- Vite
- JavaScript ES modules
- Phaser 4
- DOM overlay cho UI học tập
- localStorage cho family prototype

## Architecture rule

`GameScene` không tự quyết định nội dung học. `QuestionEngine` là authority tạo/đánh nhãn câu hỏi. Dữ liệu mastery được lưu riêng trong `ProfileStore` để sau này có thể thay localStorage bằng backend mà không phải viết lại combat engine.

## Chưa làm ở V0.1

- Multiplayer / room code.
- Account online / Supabase.
- Teacher dashboard.
- Monetization.
- Asset production-quality.
- Curriculum mapping đầy đủ theo chương trình Việt Nam.

Các phần này chỉ mở sau khi test trẻ thật cho thấy core loop đủ hấp dẫn.
