import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { successResponse } from '../lib/response.js';

const router = Router();

const galleryItems = [
  { id: 'ritual', src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAgsgrsea3s59iP2h_UPzdIRThns2V9eDtBupSQb0ajnrHt-aMgKxuG3fO-IJOyPUgSR486ATew_kIkyC_p6yOjlNwsSQaCOde69lRhPdGn-tVCvWsiWBod-IpJoTxWTlZPpgBVf1s56Xneskz9f-Deu3szbw7UBFAAJP_19qwAfZK4U-Q073zaFOmNk5zdYcWYyEtdboc8r3_8ucm3oYrhhWEnCeQTJI73Xs-YER9qkOybuvByfhbU9z2qT1U3iAJ-Sbbm0hHQjSM', alt: 'The Ritual — Professional barber with straight razor', caption: 'The Ritual — Signature straight razor service', category: 'beard' },
  { id: 'precision-fade', src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCCGY3al1THGcKaPPFtxqRu2vvjqY4LwHoqJrOm5pdQLhH0WHltQvCgZ_wM64MkjpwdF7aFz4cbv2Gp9j5jndmlJYoB-RjbA1Wo9779pMe-3Q9lzmQ6W876kkVYE5qi4BC1_foE7Lt8pJ_MKCWXjquuWazmAjCVKZ6NG1WAfsmyyw0ze7GZqrp550kv31mRuLDifaRMTpGjN_1QLMF5wlh3d7uEHZIinaL6UcUQhFEmpgcTT6wRUpOu9CaXvlBDHuwKmGrRYhpfIOM', alt: 'Precision Fade — Sharp pompadour fade', caption: 'Precision Fade — Modern craftsmanship', category: 'haircuts' },
  { id: 'interior', src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuATpDnWLmxs90K1miTo0_GCAduiBUtK39dKPIVJUAMgbja2-sqNves9Bv_zzr_ORTJKhwcSHno8AkTHOgq2o_pqI18eLRIFxqEpBtUu3CxaURK4P-3VbFvpPcYbXO-Lr4sDqCYwpbfGPE15Rg2UxXbb1ELCHtjKOYr2CHZmiTPGK2eKnVfCa4F0B0Yg4p3E3A4bd-CRPedQ6YhsV86QTM1o7uZzpcUJS_nefaOhC_v_5K4hbKXXqNPuSnXQ5WO80fVCQcYep5T55s4', alt: 'Atelier interior', caption: 'The Atelier — Luxury interior', category: 'interior' },
  { id: 'texture', src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCdsI9UGiS5oEPUMmrFO5SLVMGl51d8jS42NInapOHHLxSKA3VXXn-ixj-NhcrqslPU-UaRPJ9Dl8u2c2aW-KzYb4wkLVL9IYXL2AgpKcog2xja8t5xexR-bPT5Ez28cxhpOjlZ6B_MGuqKtSMTvqYQaq3XYxyp3M7Hu5JxwHl6JuJUQ-mg2EbUj0F512_AgNVaobeE62qMy_Hj4atPL1yRsTvaU3V8lnwhdXvcJNIsXkvS1YgW2eAu5FHsrqutnxDMV24-Ak-Q3Eo', alt: 'Texture detail', caption: 'Texture — Precision hair detail', category: 'haircuts' },
  { id: 'instruments', src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuACRyuKX3E51xihsEAikM2i15ShT2IznSduCM7fLXOPgZwpc4Igk1S3cVLKQ70MINLFjG9REDPNV4P1DRQzhSICFbzGrY7qYYNmSMH_T36AK_mvObjqVjw_5ZeSL8uxc07LqTloVFTngC0rEZhL35U4deCgCJHUWYGDdju2YS6FbN_S1O3SXL7ZXSqt94uAimDnsX8jU6-R2u7ReICcBnXbRfv47RtfVOFP8ZIQXDcz61HhknDpJLlZ9_1XX9UP8HskOiCCXHTVr0c', alt: 'Barber instruments', caption: 'Instruments — Artisan grooming tools', category: 'interior' },
  { id: 'lounge', src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAv_vjZMRSC0opX91cNl6qBdLSbYyCh5Y1KLRulq0NPY1AdMVetWNLF6QQwkVDt3ZcyMu8khMNZcqoh0_2EYHX3KnejludOwlTnQsQTOaxKaJ683DAv5Y-n8uLpXLvYPv1NsbGW9HANFPkDItuNX3f-BtxINotwkf-wpzw3_NjG6xowNyzMEN6u1RllhX76d8M_s-edRI6-Ke4_7zd2YN7TJEefpz_9uzjxlJ1WXjf84tGhkQBiw4e6YpR1rT_lli1RZEmwXScfRA0', alt: 'Lounge area', caption: 'The Lounge — Luxury waiting area', category: 'interior' },
  { id: 'classic-cut', src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD-AUKhL6TpsUNRUOsMZF3EyYUbqwmtDC5qsseLVVJI3fv3DqNHbM3vRQSr4Lg2BUS86R9PEufxlJ4Do8b233iCnB98KKM3EXxQrOjDB8hVxRMdvafRZleiU1cpzt1LZRls64ZHp_LqVsJO4m6zwJnVQdfCmtPyV-GRp2dXDO2IuIgIo__Nb3DBSIjhHWIO3L4YM4d2JzUU4RHl1Q8o37la2PS6ZYaYCuFlskHjRu7uEN3IZD_8F_t8zS9ObOp3anohTTrSXkbciIw', alt: 'Classic cut', caption: 'Classic Cut — Perfectly blended hairline', category: 'haircuts' },
  { id: 'hot-towel', src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCEIQLKZY9nlq2EIQizVjFDYxiRYND5o8HpDnLHmpSC2vydd4BZVNPNOK-ScSdjDFVyLLSsk65Ethxx53UC9ruKudEJOsozF8UPJgr73XQy528wkjUplnoli-h1xqhJigGzPnfXg8pO1HIeg9jE0qcpAz4b3lwLu1rNCarlN9dg-RhyLHEFh-sKAhRNH5_BaB44t6iyIApPqR2hz8DLUkuEzlYWmxVFkBrtU77Zat_Byn3bc_fjp6dQArBUemNjytx00tkXSkh5d18', alt: 'Hot towel treatment', caption: 'Hot Towel Treatment — The ultimate relaxation ritual', category: 'beard' },
];

router.get('/', asyncHandler(async (_req: Request, res: Response) => {
  res.json(successResponse({ items: galleryItems }));
}));

export default router;
