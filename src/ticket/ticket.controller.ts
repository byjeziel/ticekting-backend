import { Controller, Get, Post, Body, Param, Delete, UseGuards, Request, Query, Res, Patch } from '@nestjs/common';
import { TicketService } from './ticket.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { Response } from 'express';

@ApiTags('tickets')
@Controller('tickets')
export class TicketController {
  constructor(private readonly ticketService: TicketService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Book tickets for an event' })
  @ApiResponse({ status: 201, description: 'Ticket booking initiated.' })
  @ApiBody({ type: CreateTicketDto })
  create(@Body() createTicketDto: CreateTicketDto, @Request() req) {
    return this.ticketService.create(createTicketDto, req.user.userId);
  }

  @Get('my-tickets')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get customer tickets' })
  @ApiResponse({ status: 200, description: 'List of customer tickets.' })
  findMyTickets(@Request() req) {
    return this.ticketService.findByCustomer(req.user.userId);
  }

  @Patch('dev/confirm-pending')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '[DEV] Confirm all pending tickets without payment' })
  @ApiResponse({ status: 200, description: 'Pending tickets confirmed.' })
  devConfirmPending(@Request() req) {
    return this.ticketService.devConfirmPending(req.user.userId);
  }

  @Get('reference/:bookingReference')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Find ticket by booking reference' })
  @ApiParam({ name: 'bookingReference', description: 'Booking reference' })
  @ApiResponse({ status: 200, description: 'Ticket found.' })
  findByBookingReference(@Param('bookingReference') bookingReference: string) {
    return this.ticketService.findByBookingReference(bookingReference);
  }

  // Public: user clicks link in email (no JWT)
  @Get('verify-email')
  @ApiOperation({ summary: 'Verify email address' })
  @ApiQuery({ name: 'token', description: 'Email verification token' })
  @ApiResponse({ status: 200, description: 'Email verification result.' })
  async verifyEmail(@Query('token') token: string) {
    return this.ticketService.verifyEmail(token);
  }

  @Post('validate')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Validate ticket QR code (Staff only)' })
  @ApiResponse({ status: 200, description: 'Ticket validation result.' })
  async validateTicket(@Body() body: { qrData: string }, @Request() req) {
    return this.ticketService.validateTicket(body.qrData, req.user.userId);
  }

  // Public: MercadoPago server POSTs here — no JWT available
  @Post('mercadopago/webhook')
  @ApiOperation({ summary: 'MercadoPago webhook handler' })
  @ApiResponse({ status: 200, description: 'Webhook processed.' })
  async handleMercadoPagoWebhook(@Body() webhookData: any) {
    if (webhookData.type === 'payment' && webhookData.data?.id) {
      await this.ticketService.handleMercadoPagoPayment(String(webhookData.data.id));
    }
    return { status: 'ok' };
  }

  // Public: browser redirect from MercadoPago — no JWT in URL
  @Get('mercadopago/payment/success')
  @ApiOperation({ summary: 'Payment success redirect' })
  async paymentSuccess(
    @Query('payment_id') paymentId?: string,
    @Query('external_reference') externalReference?: string,
    @Res() res?: Response,
  ) {
    if (paymentId) {
      await this.ticketService.handleMercadoPagoPayment(paymentId);
    }
    res?.redirect(
      `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment/success?reference=${externalReference ?? ''}`,
    );
  }

  @Get('mercadopago/payment/failure')
  @ApiOperation({ summary: 'Payment failure redirect' })
  async paymentFailure(@Query('external_reference') externalReference?: string, @Res() res?: Response) {
    res?.redirect(
      `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment/failure?reference=${externalReference ?? ''}`,
    );
  }

  @Get('mercadopago/payment/pending')
  @ApiOperation({ summary: 'Payment pending redirect' })
  async paymentPending(@Query('external_reference') externalReference?: string, @Res() res?: Response) {
    res?.redirect(
      `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment/pending?reference=${externalReference ?? ''}`,
    );
  }

  @Post(':id/transfer')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Transfer a confirmed ticket to another registered user' })
  @ApiParam({ name: 'id', description: 'Ticket ID' })
  @ApiResponse({ status: 200, description: 'Ticket transferred.' })
  async transferTicket(
    @Param('id') id: string,
    @Body() body: { recipientEmail: string },
    @Request() req,
  ) {
    return this.ticketService.transferTicket(id, req.user.userId, body.recipientEmail);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Cancel ticket' })
  @ApiParam({ name: 'id', description: 'Ticket ID' })
  @ApiResponse({ status: 200, description: 'Ticket cancelled.' })
  cancelTicket(@Param('id') id: string, @Request() req) {
    return this.ticketService.cancelTicket(id, req.user.userId);
  }
}
