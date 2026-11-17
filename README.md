# منظّم المهام

أداة لتنظيم المهام مع الجهات: MedGlobal · ChildGuardians · ACU · MED · Sakka.
تُحفظ البيانات في `data/tasks.json` داخل هذا المستودع، والواجهة تُنشر على Vercel.

## الإعداد على Vercel
1. استورد المستودع في Vercel (بدون أي إعدادات بناء).
2. أنشئ GitHub Token من نوع Fine-grained لهذا المستودع فقط بصلاحية **Contents: Read and write**.
3. أضف متغيرات البيئة:
   - `GITHUB_TOKEN` (إلزامي)
   - `APP_PASSWORD` (اختياري، لحماية الأداة بكلمة مرور)
   - `GITHUB_REPO` (افتراضياً `malikmehmetoglu-spec/TASK`)
4. أعد النشر.

ملاحظة: `ignoreCommand` في `vercel.json` يمنع Vercel من إعادة النشر عند كل حفظ للمهام.
